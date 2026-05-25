/**
 * H2H Healthcare - Doctor Details API for Patients
 * Fetch detailed doctor information including availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveDoctorAvatarSrc } from '@/constants/doctor-avatars';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = createAdminClient();

    // Fetch doctor details
    const { data: doctor, error } = await (adminClient.from('doctors') as any)
      .select(`
        id,
        specializations,
        qualifications,
        experience_years,
        bio,
        consultation_fee,
        rating,
        total_reviews,
        offers_online,
        offers_clinic,
        offers_home_visit,
        home_visit_radius_km,
        google_meet_enabled,
        created_at,
        users:user_id(id, full_name, email, phone, avatar_url),
        location:location_id(id, name, city, tier),
        doctor_availability(
          id,
          day_of_week,
          start_time,
          end_time,
          is_available,
          mode,
          center_id,
          clinic_centers:center_id(id, name, location:location_id(id, name, city))
        ),
        doctor_services(
          service:service_id(id, name, category, duration_minutes, tier1_price, tier2_price)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    // Fetch clinic centers for the doctor's availability - get unique center IDs
    const centerIds = [...new Set(
      doctor.doctor_availability
        ?.filter((a: any) => a.center_id)
        .map((a: any) => a.center_id) || []
    )];
    
    let clinicCenters: any[] = [];
    
    // Fetch clinic centers if we have center IDs
    if (centerIds.length > 0) {
      const { data: centers } = await (adminClient.from('clinic_centers') as any)
        .select(`
          id, 
          name, 
          address, 
          phone, 
          facilities, 
          rating,
          location:location_id(id, name, city)
        `)
        .in('id', centerIds);
      
      if (centers && centers.length > 0) {
        clinicCenters = centers.map((c: any) => ({
          id: c.id,
          name: c.name,
          address: c.address || '',
          city: c.location?.city || '',
          phone: c.phone || '',
          facilities: c.facilities || [],
          rating: c.rating || 0,
        }));
      }
    }

    // Fetch consultation slot types for this doctor (Online vs Clinic pricing)
    const { data: slotTypes } = await (adminClient.from('consultation_slot_types') as any)
      .select('id, duration_minutes, name, online_price, clinic_price, is_active')
      .eq('doctor_id', id)
      .eq('is_active', true)
      .order('duration_minutes', { ascending: true });

    // Get doctor's reviews
    const { data: reviews } = await (adminClient.from('reviews') as any)
      .select(`
        id,
        rating,
        comment,
        created_at,
        patient:patient_id(users:user_id(full_name, avatar_url))
      `)
      .eq('doctor_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Transform availability by day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyAvailability = dayNames.map((day, index) => {
      const slots = doctor.doctor_availability?.filter((a: any) => a.day_of_week === index && a.is_available) || [];
      return {
        day,
        dayIndex: index,
        isAvailable: slots.length > 0,
        slots: slots.map((slot: any) => ({
          startTime: slot.start_time,
          endTime: slot.end_time,
          mode: slot.mode,
          centerId: slot.center_id,
          centerName: clinicCenters.find((c: any) => c.id === slot.center_id)?.name || null,
        })),
      };
    });

    // Get total appointments count for this doctor
    const { count: totalAppointments } = await (adminClient.from('appointments') as any)
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', id);

    // Get unique patients count
    const { data: uniquePatients } = await (adminClient.from('appointments') as any)
      .select('patient_id')
      .eq('doctor_id', id);
    const totalPatients = new Set(uniquePatients?.map((a: any) => a.patient_id) || []).size;

    // Build available cities from availability
    const availableCities = new Set<string>();
    if (doctor.location?.city) {
      availableCities.add(doctor.location.city);
    }
    doctor.doctor_availability?.forEach((avail: any) => {
      if (avail.clinic_centers?.location?.city) {
        availableCities.add(avail.clinic_centers.location.city);
      }
    });

    // Calculate min fees for Online and Clinic from slot types
    let onlineFeeMin: number | null = null;
    let clinicFeeMin: number | null = null;
    
    if (slotTypes && slotTypes.length > 0) {
      const onlinePrices = slotTypes.filter((s: any) => s.online_price).map((s: any) => s.online_price);
      const clinicPrices = slotTypes.filter((s: any) => s.clinic_price).map((s: any) => s.clinic_price);
      
      if (onlinePrices.length > 0) {
        onlineFeeMin = Math.min(...onlinePrices);
      }
      if (clinicPrices.length > 0) {
        clinicFeeMin = Math.min(...clinicPrices);
      }
    }

    // Transform response
    const transformedDoctor = {
      id: doctor.id,
      name: doctor.users?.full_name || 'Doctor',
      email: doctor.users?.email,
      phone: doctor.users?.phone,
      avatarUrl: doctor.users?.avatar_url || null,
      avatar: resolveDoctorAvatarSrc({
        name: doctor.users?.full_name,
        email: doctor.users?.email,
        avatar: doctor.users?.avatar_url,
      }),
      specializations: doctor.specializations || [],
      qualifications: doctor.qualifications || [],
      experienceYears: doctor.experience_years,
      bio: doctor.bio,
      onlineFee: onlineFeeMin,
      clinicFee: clinicFeeMin,
      rating: doctor.rating,
      totalReviews: doctor.total_reviews,
      offersOnline: doctor.offers_online,
      offersClinic: doctor.offers_clinic,
      offersHomeVisit: doctor.offers_home_visit,
      homeVisitRadius: doctor.home_visit_radius_km,
      googleMeetEnabled: doctor.google_meet_enabled,
      memberSince: doctor.created_at,
      totalPatients: totalPatients || 0,
      totalAppointments: totalAppointments || 0,
      availableCities: Array.from(availableCities),
      location: doctor.location ? {
        id: doctor.location.id,
        name: doctor.location.name,
        city: doctor.location.city,
        tier: doctor.location.tier,
      } : null,
      consultationTypes: (slotTypes || []).map((st: any) => ({
        id: st.id,
        name: st.name,
        duration: st.duration_minutes,
        onlinePrice: st.online_price,
        clinicPrice: st.clinic_price,
      })),
      services: doctor.doctor_services?.map((ds: any) => ({
        id: ds.service?.id,
        name: ds.service?.name,
        category: ds.service?.category,
        duration: ds.service?.duration_minutes,
        price: doctor.location?.tier === 1 ? ds.service?.tier1_price : ds.service?.tier2_price,
      })) || [],
      weeklyAvailability,
      clinicCenters: clinicCenters,
      reviews: (reviews || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        date: r.created_at,
        patientName: r.patient?.users?.full_name || 'Anonymous',
        patientAvatar: r.patient?.users?.avatar_url,
      })),
    };

    return NextResponse.json({ success: true, data: transformedDoctor });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
