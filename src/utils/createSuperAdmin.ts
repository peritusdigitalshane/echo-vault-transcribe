
import { supabase } from "@/integrations/supabase/client";

export const createSuperAdminAccount = async () => {
  try {
    console.log('Starting super admin creation process...');
    
    // First, try to sign up the super admin user directly
    // Don't check existing profiles first as RLS might block the query
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@lyfescribe.com',
      password: 'SuperAdmin123!',
      options: {
        data: {
          full_name: 'Super Admin',
          role: 'super_admin',
        },
      },
    });

    console.log('Signup attempt result:', { signUpData, signUpError });

    if (signUpError) {
      // If user already exists, that's actually fine
      if (signUpError.message.includes('already registered')) {
        console.log('Super admin already exists - this is expected');
        return { success: true, alreadyExists: true };
      }
      console.error('Error creating super admin:', signUpError);
      return { success: false, error: signUpError };
    }

    if (signUpData.user) {
      console.log('Super admin user created successfully:', signUpData.user.id);
      
      // Try to verify the profile was created by the trigger
      setTimeout(async () => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signUpData.user!.id)
            .single();
          
          console.log('Profile creation check:', { profile, profileError });
        } catch (err) {
          console.log('Profile check error (this might be normal):', err);
        }
      }, 2000);
      
      return { success: true, data: signUpData };
    }

    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.error('Unexpected error in createSuperAdminAccount:', error);
    return { success: false, error };
  }
};
