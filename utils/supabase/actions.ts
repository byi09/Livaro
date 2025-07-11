'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// Password validation utility for server-side
const validatePasswordServer = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  return Object.values(requirements).every(req => req);
};

export async function signUpNewUser(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Server-side password validation
  if (!validatePasswordServer(password)) {
    redirect('/error?type=weak_password&message=Password must be at least 8 characters and contain uppercase, lowercase, number, and special character')
  }
  
  // Build absolute redirect URL for email confirmation
  // Use request origin if available (server actions), otherwise fallback to env or localhost
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://www.rentlivaro.com'
  const emailRedirectTo = `${origin}/callback?next=/sign-in%3Fverified%3Dtrue`
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  })
  if (error) {
    redirect('/error')
  }
  redirect('/confirm-email')
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.log('Sign in error:', error) // Debug log
    
    // Check specific error types
    if (error.message === 'Email not confirmed') {
      redirect('/error?type=email_not_confirmed')
    } else if (error.message === 'Invalid login credentials') {
      redirect('/error?type=invalid_credentials')
    } else {
      redirect('/error?type=unknown')
    }
  }
  
  // Success - redirect to home
  redirect('/')
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient()
  
  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      redirect('/error?type=auth');
    }

    // Attempt to fetch landlord_id in two steps to avoid issues with RLS joins
    let landlordId: string | null = null;

    // First try the join query (more efficient)
    const { data: landlordData, error: landlordError } = await supabase
      .from('users')
      .select(`
        customers!inner(
          landlords!inner(id)
        )
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (landlordData?.customers?.length && landlordData.customers[0].landlords?.length) {
      landlordId = landlordData.customers[0].landlords[0].id;
    }

    // Fallback: fetch customer first, then landlord
    if (!landlordId) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customerError && customer?.id) {
        const { data: landlordRow } = await supabase
          .from('landlords')
          .select('id')
          .eq('customer_id', customer.id)
          .maybeSingle();

        landlordId = landlordRow?.id ?? null;
      }
    }

    if (!landlordId) {
      console.error('Landlord profile not found for user', user.id);
      redirect('/error?type=profile');
    }

    // Extract form data
    const propertyData = {
      landlord_id: landlordId,
      address_line_1: formData.get('address_line_1') as string,
      address_line_2: formData.get('address_line_2') as string || null,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip_code: formData.get('zip_code') as string,
      property_type: formData.get('property_type') as string || 'apartment',
      bedrooms: parseInt(formData.get('bedrooms') as string),
      bathrooms: parseFloat(formData.get('bathrooms') as string),
      square_footage: parseInt(formData.get('square_footage') as string),
      description: formData.get('description') as string || null,
      year_built: formData.get('year_built') ? parseInt(formData.get('year_built') as string) : null,
    }

    // Insert the property
    const { data, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()

    if (error) {
      console.error('Error creating property:', error)
      redirect('/error?type=unknown')
    }

    console.log('Property created successfully:', data)
    
    // Store the property ID in the URL params for the next step
    revalidatePath('/sell/create', 'layout')
    revalidatePath('/sell/create/rent-details', 'layout')
    redirect(`/sell/create/rent-details?property_id=${data[0].id}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
    redirect('/error?type=unknown')
  }
}

export async function createPropertyListing(formData: FormData) {
  const supabase = await createClient()
  
  try {
    const property_id = formData.get('property_id') as string
    
    if (!property_id) {
      console.error('No property ID provided')
      redirect('/error?type=unknown')
    }

    // Extract form data
    const listingData = {
      property_id,
      monthly_rent: parseFloat(formData.get('monthly_rent') as string),
      security_deposit: formData.get('security_deposit') ? parseFloat(formData.get('security_deposit') as string) : null,
      pet_deposit: formData.get('pet_deposit') ? parseFloat(formData.get('pet_deposit') as string) : null,
      application_fee: formData.get('application_fee') ? parseFloat(formData.get('application_fee') as string) : null,
      minimum_lease_term: formData.get('minimum_lease_term') ? parseInt(formData.get('minimum_lease_term') as string) : null,
      maximum_lease_term: formData.get('maximum_lease_term') ? parseInt(formData.get('maximum_lease_term') as string) : null,
      available_date: formData.get('available_date') as string || null,
      listing_title: formData.get('listing_title') as string || null,
      listing_description: formData.get('listing_description') as string || null,
      listing_status: 'active',
    }

    // Insert the property listing
    const { data, error } = await supabase
      .from('property_listings')
      .insert([listingData])
      .select()

    if (error) {
      console.error('Error creating property listing:', error)
      redirect('/error?type=unknown')
    }

    console.log('Property listing created successfully:', data)
    
    revalidatePath('/sell/create', 'layout')
    redirect(`/sell/create/media?property_id=${property_id}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
    redirect('/error?type=unknown')
  }
}

export async function addPropertyFeatures(formData: FormData) {
  const supabase = await createClient()
  
  try {
    const property_id = formData.get('property_id') as string
    
    if (!property_id) {
      console.error('No property ID provided')
      redirect('/error?type=unknown')
    }

    // Extract features data - this will be an array of features
    const features = []
    
    // Get all form fields that start with 'feature_'
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('feature_') && value && value !== '') {
        const [, category, name] = key.split('_', 3)
        const featureValue = value as string
        
        features.push({
          property_id,
          feature_name: name.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase()),
          feature_category: category as 'interior' | 'exterior' | 'building_amenities' | 'appliances' | 'utilities',
          feature_value: featureValue
        })
      }
    }

    // Handle custom amenities
    const customAmenities = formData.get('custom_amenities') as string
    if (customAmenities && customAmenities.trim()) {
      // Split custom amenities by line or comma and add them as individual features
      const customFeatures = customAmenities.split(/[,\n]/).map(amenity => amenity.trim()).filter(amenity => amenity)
      
      customFeatures.forEach(amenity => {
        features.push({
          property_id,
          feature_name: amenity,
          feature_category: 'building_amenities' as const,
          feature_value: 'available'
        })
      })
    }

    if (features.length > 0) {
      // Insert the property features
      const { data, error } = await supabase
        .from('property_features')
        .insert(features)
        .select()

      if (error) {
        console.error('Error creating property features:', error)
        redirect('/error?type=unknown')
      }

      console.log('Property features created successfully:', data)
    }
    
    revalidatePath('/sell/create', 'layout')
    redirect(`/sell/create/screening?property_id=${property_id}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
    redirect('/error?type=unknown')
  }
}


//MODIFIED
import { ParsedQuery } from "@/utils/queryParser";

export async function fetchFilteredProperties(filters: ParsedQuery) {
  const supabase = await createClient();
  let query = supabase.from("properties").select("*");

  if (filters.location)
    query = query.ilike("address", `%${filters.location}%`);
  if (filters.propertyType)
    query = query.eq("property_type", filters.propertyType);
  if (filters.beds)
    query = query.eq("beds", filters.beds);
  if (filters.minPrice)
    query = query.gte("price", filters.minPrice);
  if (filters.maxPrice)
    query = query.lte("price", filters.maxPrice);
  if (filters.petFriendly)
    query = query.eq("pet_friendly", true);
  if (filters.parking)
    query = query.eq("parking", true);
  if (filters.furnished)
    query = query.eq("furnished", true);
  if (filters.utilitiesIncluded)
    query = query.eq("utilities_included", true);
  if (filters.leaseLength)
    query = query.eq("lease_length", filters.leaseLength);
  if (filters.moveInDate)
    query = query.gte("available_from", filters.moveInDate);
  if (filters.distanceToCampus)
    query = query.lte("distance_to_campus", filters.distanceToCampus);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}
