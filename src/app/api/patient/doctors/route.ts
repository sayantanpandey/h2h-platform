/**
 * H2H Healthcare - Doctors Listing API for Patients
 * Fetch all doctors with filtering options
 * City filter includes doctors who have availability in that city (not just primary location)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveDoctorAvatarSrc } from '@/constants/doctor-avatars';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const specialization = searchParams.get('specialization') || '';
    const city = searchParams.get('city') || '';

    // Fetch all doctors with their availability and clinic centers
    let query = (adminClient.from('doctors') as any)
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
        created_at,
        users:user_id(id, full_name, email, avatar_url),
        location:location_id(id, name, city),
        doctor_availability(
          id,
          center_id,
          clinic_centers:center_id(id, name, location:location_id(id, name, city))
        )
      `)
      .eq('is_active', true);

    const { data: doctors, error } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch doctors' }, { status: 500 });
    }

    // Build a set of all cities where each doctor has availability
    const doctorCitiesMap = new Map<string, Set<string>>();
    
    (doctors || []).forEach((doc: any) => {
      const cities = new Set<string>();
      
      // Add primary location city
      if (doc.location?.city) {
        cities.add(doc.location.city);
      }
      
      // Add cities from availability (clinic centers)
      doc.doctor_availability?.forEach((avail: any) => {
        if (avail.clinic_centers?.location?.city) {
          cities.add(avail.clinic_centers.location.city);
        }
      });
      
      doctorCitiesMap.set(doc.id, cities);
    });

    // Filter and transform
    let filteredDoctors = (doctors || []).map((doc: any) => {
      const availableCities = Array.from(doctorCitiesMap.get(doc.id) || []);
      
      return {
        id: doc.id,
        name: doc.users?.full_name || 'Doctor',
        email: doc.users?.email || '',
        avatarUrl: doc.users?.avatar_url || null,
        avatar: resolveDoctorAvatarSrc({
          name: doc.users?.full_name,
          email: doc.users?.email,
          avatar: doc.users?.avatar_url,
        }),
        specializations: doc.specializations || [],
        qualifications: doc.qualifications || [],
        experienceYears: doc.experience_years,
        bio: doc.bio,
        consultationFee: doc.consultation_fee,
        rating: doc.rating,
        totalReviews: doc.total_reviews,
        offersOnline: doc.offers_online,
        offersClinic: doc.offers_clinic,
        offersHomeVisit: doc.offers_home_visit,
        memberSince: doc.created_at,
        location: doc.location ? {
          id: doc.location.id,
          name: doc.location.name,
          city: doc.location.city,
        } : null,
        availableCities, // All cities where doctor has availability
      };
    });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDoctors = filteredDoctors.filter((doc: any) => 
        doc.name.toLowerCase().includes(searchLower) ||
        doc.specializations?.some((s: string) => s.toLowerCase().includes(searchLower))
      );
    }

    if (specialization) {
      filteredDoctors = filteredDoctors.filter((doc: any) =>
        doc.specializations?.some((s: string) => s.toLowerCase().includes(specialization.toLowerCase()))
      );
    }

    // City filter: include doctors who have availability in that city (not just primary location)
    if (city) {
      const cityLower = city.toLowerCase();
      filteredDoctors = filteredDoctors.filter((doc: any) =>
        doc.availableCities?.some((c: string) => c.toLowerCase().includes(cityLower))
      );
    }

    // Get unique specializations and cities for filters
    const allSpecializations = new Set<string>();
    const allCities = new Set<string>();
    
    (doctors || []).forEach((doc: any) => {
      doc.specializations?.forEach((s: string) => allSpecializations.add(s));
      // Add all cities from availability map
      const docCities = doctorCitiesMap.get(doc.id);
      docCities?.forEach(c => allCities.add(c));
    });

    return NextResponse.json({
      success: true,
      data: filteredDoctors,
      filters: {
        specializations: Array.from(allSpecializations).sort(),
        cities: Array.from(allCities).sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
