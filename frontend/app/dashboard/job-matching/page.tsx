import { redirect } from "next/navigation";

// Permanent redirect — route renamed from job-matching to job-search.
export default function JobMatchingRedirect() {
  redirect("/dashboard/job-search");
}
