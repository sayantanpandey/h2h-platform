/**
 * Admin Doctors API - Full CRUD for doctor management
 * Only accessible by super_admin and location_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ensureDoctorAuthUser, sendDoctorWelcomeEmail } from '@/lib/doctor-credentials';
import { getAppBaseUrl } from '@/lib/auth/app-url';

interface DoctorInput {
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  location_id?: string;
  specializations: string[];
  qualifications: string[];
  experience_years: number;
  bio?: string;
  consultation_fee: number;
  rating?: number;
  total_reviews?: number;
  google_meet_enabled?: boolean;
  is_active?: boolean;
  services?: string[]; // Array of service IDs
  availability?: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
}

async function checkAdminAccess(): Promise<{ isAdmin: boolean; adminClient: any; userId: string | null }> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, adminClient, userId: null };

  const { data: userData } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  const isAdmin = (userData as any)?.role === 'super_admin' || (userData as any)?.role === 'location_admin';
  return { isAdmin, adminClient, userId: user.id };
}

// GET - List all doctors with details
export async function GET(request: NextRequest) {
  try {
    const { isAdmin, adminClient } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const isActive = searchParams.get('isActive');

    // Get doctors with user info and location info
    let query = adminClient
      .from('doctors')
      .select(`
        id,
        user_id,
        location_id,
        specializations,
        qualifications,
        experience_years,
        bio,
        google_calendar_id,
        google_meet_enabled,
        consultation_fee,
        rating,
        total_reviews,
        is_active,
        created_at,
        users:user_id (
          id,
          email,
          full_name,
          phone,
          avatar_url
        ),
        locations:location_id (
          id,
          name,
          city
        )
      `)
      .order('created_at', { ascending: false });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    } else if (isActive === 'false') {
      query = query.eq('is_active', false);
    }

    const { data: doctors, error } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get services for each doctor
    const doctorIds = (doctors || []).map((d: any) => d.id);
    const { data: doctorServices } = await adminClient
      .from('doctor_services')
      .select('doctor_id, service_id, services:service_id(id, name, slug)')
      .in('doctor_id', doctorIds);

    // Get availability for each doctor
    const { data: doctorAvailability } = await adminClient
      .from('doctor_availability')
      .select('*')
      .in('doctor_id', doctorIds);

    // Merge data
    const enrichedDoctors = (doctors || []).map((doctor: any) => ({
      ...doctor,
      user: doctor.users,
      location: doctor.locations,
      services: (doctorServices || [])
        .filter((ds: any) => ds.doctor_id === doctor.id)
        .map((ds: any) => ds.services),
      availability: (doctorAvailability || [])
        .filter((da: any) => da.doctor_id === doctor.id),
    }));

    return NextResponse.json({
      success: true,
      data: enrichedDoctors,
      count: enrichedDoctors.length,
    });
  } catch (error) {
    console.error('Error in doctors GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new doctor
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, adminClient } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body: DoctorInput = await request.json();
    const {
      email,
      full_name,
      phone,
      avatar_url,
      location_id,
      specializations,
      qualifications,
      experience_years,
      bio,
      consultation_fee,
      rating = 5.0,
      total_reviews = 0,
      google_meet_enabled = true,
      is_active = true,
      services = [],
      availability = [],
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 });
    }

    if (!specializations || specializations.length === 0) {
      return NextResponse.json({ error: 'At least one specialization is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (case-insensitive)
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, role, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      const { data: existingDoctor } = await adminClient
        .from('doctors')
        .select('id')
        .eq('user_id', (existingUser as { id: string }).id)
        .maybeSingle();

      if (existingDoctor) {
        return NextResponse.json(
          { error: 'A doctor account already exists for this email address.' },
          { status: 400 }
        );
      }
    }

    let userId: string;
    let authUserIdForRollback: string | null = null;
    let temporaryPassword: string | null = null;

    try {
      const authResult = await ensureDoctorAuthUser(
        adminClient,
        normalizedEmail,
        full_name,
        existingUser ? (existingUser as { id: string }).id : undefined
      );
      temporaryPassword = authResult.temporaryPassword;
      if (authResult.authCreated) {
        authUserIdForRollback = authResult.authUserId;
      }

      if (existingUser) {
        userId = (existingUser as { id: string }).id;

        await adminClient
          .from('users')
          .update({
            role: 'doctor',
            full_name,
            phone,
            avatar_url,
            location_id,
            email: normalizedEmail,
          })
          .eq('id', userId);
      } else {
        const { data: newUser, error: userError } = await adminClient
          .from('users')
          .insert({
            id: authResult.authUserId,
            email: normalizedEmail,
            full_name,
            phone,
            avatar_url,
            role: 'doctor',
            location_id,
            is_active: true,
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Error creating user:', userError);
          if (authUserIdForRollback) {
            await adminClient.auth.admin.deleteUser(authUserIdForRollback);
          }
          return NextResponse.json({ error: 'Failed to create user: ' + userError.message }, { status: 500 });
        }

        userId = (newUser as { id: string }).id;
      }
    } catch (authErr) {
      console.error('Doctor auth setup failed:', authErr);
      return NextResponse.json(
        {
          error:
            authErr instanceof Error
              ? authErr.message
              : 'Failed to set up doctor login credentials',
        },
        { status: 500 }
      );
    }

    // Create doctor record
    const { data: doctor, error: doctorError } = await adminClient
      .from('doctors')
      .insert({
        user_id: userId,
        location_id,
        specializations,
        qualifications: qualifications || [],
        experience_years: experience_years || 0,
        bio,
        consultation_fee: consultation_fee || 1000,
        rating: rating || 5.0,
        total_reviews: total_reviews || 0,
        google_meet_enabled,
        is_active,
      })
      .select('id')
      .single();

    if (doctorError) {
      console.error('Error creating doctor:', doctorError);
      if (authUserIdForRollback) {
        await adminClient.from('users').delete().eq('id', authUserIdForRollback);
        await adminClient.auth.admin.deleteUser(authUserIdForRollback);
      }
      return NextResponse.json({ error: 'Failed to create doctor: ' + doctorError.message }, { status: 500 });
    }

    const doctorId = (doctor as any).id;

    // Add services if provided
    if (services.length > 0) {
      const serviceLinks = services.map(serviceId => ({
        doctor_id: doctorId,
        service_id: serviceId,
      }));

      const { error: servicesError } = await adminClient
        .from('doctor_services')
        .insert(serviceLinks);

      if (servicesError) {
        console.error('Error linking services:', servicesError);
      }
    }

    // Add availability if provided
    if (availability.length > 0) {
      const availabilityRecords = availability.map(slot => ({
        doctor_id: doctorId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available,
      }));

      const { error: availError } = await adminClient
        .from('doctor_availability')
        .insert(availabilityRecords);

      if (availError) {
        console.error('Error adding availability:', availError);
      }
    } else {
      // Add default availability (Mon-Fri 9am-6pm)
      const defaultAvailability = [0, 1, 2, 3, 4, 5].map(day => ({
        doctor_id: doctorId,
        day_of_week: day,
        start_time: '09:00',
        end_time: '18:00',
        is_available: day !== 0, // Sunday off by default
      }));

      await adminClient.from('doctor_availability').insert(defaultAvailability);
    }

    // Fetch complete doctor data
    const { data: completeDoctor } = await adminClient
      .from('doctors')
      .select(`
        *,
        users:user_id (id, email, full_name, phone, avatar_url),
        locations:location_id (id, name, city)
      `)
      .eq('id', doctorId)
      .single();

    const appBaseUrl = await getAppBaseUrl();
    const loginUrl = `${appBaseUrl}/doctor/login`;
    const emailResult = temporaryPassword
      ? await sendDoctorWelcomeEmail({
          email: normalizedEmail,
          fullName: full_name,
          temporaryPassword,
          loginUrl,
        })
      : { sent: false, reason: 'No password generated' };

    const message = emailResult.sent
      ? 'Doctor created successfully. Login credentials were emailed.'
      : emailResult.reason === 'SMTP not configured'
        ? 'Doctor created. SMTP is not configured — temporary password was logged on the server console.'
        : `Doctor created, but the welcome email could not be sent (${emailResult.reason ?? 'unknown'}). Check server logs for the temporary password.`;

    return NextResponse.json({
      success: true,
      data: completeDoctor,
      message,
      credentialsEmailSent: emailResult.sent,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in doctors POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a doctor
export async function PUT(request: NextRequest) {
  try {
    const { isAdmin, adminClient } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    // Get existing doctor
    const { data: existingDoctor } = await adminClient
      .from('doctors')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Update user info if provided
    const userUpdates: any = {};
    if (updateData.full_name) userUpdates.full_name = updateData.full_name;
    if (updateData.phone !== undefined) userUpdates.phone = updateData.phone;
    if (updateData.avatar_url !== undefined) userUpdates.avatar_url = updateData.avatar_url;

    if (Object.keys(userUpdates).length > 0) {
      await adminClient
        .from('users')
        .update(userUpdates)
        .eq('id', (existingDoctor as any).user_id);
    }

    // Update doctor info
    const doctorUpdates: any = {};
    if (updateData.location_id !== undefined) doctorUpdates.location_id = updateData.location_id;
    if (updateData.specializations) doctorUpdates.specializations = updateData.specializations;
    if (updateData.qualifications) doctorUpdates.qualifications = updateData.qualifications;
    if (updateData.experience_years !== undefined) doctorUpdates.experience_years = updateData.experience_years;
    if (updateData.bio !== undefined) doctorUpdates.bio = updateData.bio;
    if (updateData.consultation_fee !== undefined) doctorUpdates.consultation_fee = updateData.consultation_fee;
    if (updateData.rating !== undefined) doctorUpdates.rating = updateData.rating;
    if (updateData.total_reviews !== undefined) doctorUpdates.total_reviews = updateData.total_reviews;
    if (updateData.google_meet_enabled !== undefined) doctorUpdates.google_meet_enabled = updateData.google_meet_enabled;
    if (updateData.is_active !== undefined) doctorUpdates.is_active = updateData.is_active;
    // Consultation modes
    if (updateData.offers_online !== undefined) doctorUpdates.offers_online = updateData.offers_online;
    if (updateData.offers_clinic !== undefined) doctorUpdates.offers_clinic = updateData.offers_clinic;
    if (updateData.offers_home_visit !== undefined) doctorUpdates.offers_home_visit = updateData.offers_home_visit;
    if (updateData.home_visit_radius_km !== undefined) doctorUpdates.home_visit_radius_km = updateData.home_visit_radius_km;

    if (Object.keys(doctorUpdates).length > 0) {
      const { error: updateError } = await adminClient
        .from('doctors')
        .update(doctorUpdates)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Update services if provided
    if (updateData.services) {
      // Remove existing services
      await adminClient
        .from('doctor_services')
        .delete()
        .eq('doctor_id', id);

      // Add new services
      if (updateData.services.length > 0) {
        const serviceLinks = updateData.services.map((serviceId: string) => ({
          doctor_id: id,
          service_id: serviceId,
        }));

        await adminClient.from('doctor_services').insert(serviceLinks);
      }
    }

    // Update availability if provided (supports both legacy and new day_availability format)
    if (updateData.day_availability || updateData.availability) {
      // Remove existing availability
      await adminClient
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', id);

      // Handle new day_availability format (multiple slots per day)
      if (updateData.day_availability && updateData.day_availability.length > 0) {
        const availabilityRecords: any[] = [];
        
        for (const dayAvail of updateData.day_availability) {
          if (dayAvail.is_available && dayAvail.slots && dayAvail.slots.length > 0) {
            for (const slot of dayAvail.slots) {
              availabilityRecords.push({
                doctor_id: id,
                day_of_week: dayAvail.day_of_week,
                start_time: slot.start_time,
                end_time: slot.end_time,
                is_available: true,
                mode: slot.mode || 'both',
                center_id: slot.center_id || null,
              });
            }
          }
        }

        if (availabilityRecords.length > 0) {
          const { error: availError } = await adminClient.from('doctor_availability').insert(availabilityRecords);
          if (availError) {
            console.error('Error updating availability:', availError);
          }
        }
      }
      // Handle legacy availability format
      else if (updateData.availability && updateData.availability.length > 0) {
        const availabilityRecords = updateData.availability.map((slot: any) => ({
          doctor_id: id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
          mode: slot.mode || 'both',
        }));

        await adminClient.from('doctor_availability').insert(availabilityRecords);
      }
    }

    // Fetch updated doctor
    const { data: updatedDoctor } = await adminClient
      .from('doctors')
      .select(`
        *,
        users:user_id (id, email, full_name, phone, avatar_url),
        locations:location_id (id, name, city)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: updatedDoctor,
      message: 'Doctor updated successfully',
    });
  } catch (error) {
    console.error('Error in doctors PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a doctor
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin, adminClient } = await checkAdminAccess();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    // Get doctor to find user_id
    const { data: doctor } = await adminClient
      .from('doctors')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Delete doctor (cascades to doctor_services and doctor_availability)
    const { error: deleteError } = await adminClient
      .from('doctors')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Update user role back to patient
    await adminClient
      .from('users')
      .update({ role: 'patient' })
      .eq('id', (doctor as any).user_id);

    return NextResponse.json({
      success: true,
      message: 'Doctor deleted successfully',
    });
  } catch (error) {
    console.error('Error in doctors DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
