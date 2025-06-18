
import { supabase } from "@/integrations/supabase/client";

export const createSuperAdminAccount = async () => {
  try {
    // Sign up the super admin user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@lyfescribe.com',
      password: 'SuperAdmin123!',
      options: {
        data: {
          full_name: 'Super Admin',
          role: 'super_admin',
        },
      },
    });

    if (error) {
      console.error('Error creating super admin:', error);
      return { success: false, error };
    }

    // If user was created successfully, update their profile to ensure super_admin role
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'super_admin',
          full_name: 'Super Admin' 
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }

    console.log('Super admin account created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
};
