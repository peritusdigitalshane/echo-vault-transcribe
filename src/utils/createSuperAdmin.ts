
import { supabase } from "@/integrations/supabase/client";

export const createSuperAdminAccount = async () => {
  try {
    console.log('Starting super admin creation process...');
    
    // Check if super admin already exists by trying to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'shane@shanes.com.au',
      password: 'SuperAdmin123!',
    });

    if (signInData.user && !signInError) {
      console.log('Super admin already exists and can sign in');
      // Sign out immediately since we're just checking
      await supabase.auth.signOut();
      return { success: true, alreadyExists: true };
    }

    // If sign in failed, try to create the account
    console.log('Creating new super admin account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'shane@shanes.com.au',
      password: 'SuperAdmin123!',
      options: {
        data: {
          full_name: 'Shane (Super Admin)',
          role: 'super_admin',
        },
        // Try to bypass email confirmation if possible
        emailRedirectTo: undefined,
      },
    });

    console.log('Signup result:', { signUpData, signUpError });

    if (signUpError) {
      console.error('Error creating super admin:', signUpError);
      return { success: false, error: signUpError };
    }

    if (signUpData.user) {
      console.log('Super admin user created successfully:', signUpData.user.id);
      
      // Check if user needs confirmation
      if (signUpData.user.email_confirmed_at) {
        console.log('User is already confirmed');
      } else {
        console.log('User needs email confirmation - check Supabase settings to disable this');
      }
      
      // Sign out the newly created user since this is just setup
      await supabase.auth.signOut();
      return { success: true, data: signUpData };
    }

    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.error('Unexpected error in createSuperAdminAccount:', error);
    return { success: false, error };
  }
};
