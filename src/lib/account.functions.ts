import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    await supabaseAdmin.from("practice_attempts").delete().eq("user_id", userId);
    await supabaseAdmin.from("assessment_results").delete().eq("user_id", userId);
    await supabaseAdmin.from("mock_interviews").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_questions").delete().eq("user_id", userId);
    await supabaseAdmin.from("roadmaps").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("We could not delete your account. Please try again.");

    return { deleted: true };
  });
