
import { supabase } from "@/integrations/supabase/client";

export const createSuperAdminAccount = async () => {
  try {
    // Check if super admin already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@lyfescribe.com')
      .eq('role', 'super_admin')
      .maybeSingle();

    if (existingAdmin) {
      console.log('Super admin already exists');
      return { success: true, data: existingAdmin, alreadyExists: true };
    }

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

    console.log('Super admin account created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
};
