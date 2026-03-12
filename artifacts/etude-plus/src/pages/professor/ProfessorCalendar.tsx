import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Card, FadeIn } from "@/components/ui/Premium";

// Reusing same calendar UI as student for consistency
import { StudentCalendar } from "../student/StudentCalendar";

export function ProfessorCalendar() {
  return <StudentCalendar />;
}
