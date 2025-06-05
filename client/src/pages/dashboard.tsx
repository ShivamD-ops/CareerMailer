import { useState } from "react";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import CampaignBuilder from "@/components/dashboard/campaign-builder";
import ApplicationsTable from "@/components/dashboard/applications-table";
import EmailCalendar from "@/components/dashboard/email-calendar";
import AnalyticsChart from "@/components/dashboard/analytics-chart";
import EmailTemplateModal from "@/components/modals/email-template-modal";

export default function Dashboard() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const handleGenerateCoverLetter = (jobData: any) => {
    setSelectedJob(jobData);
    setShowTemplateModal(true);
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Overview */}
            <StatsOverview />

            {/* Campaign Builder */}
            <CampaignBuilder onGenerateCoverLetter={handleGenerateCoverLetter} />

            {/* Recent Applications */}
            <ApplicationsTable />

            {/* Calendar and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmailCalendar />
              <AnalyticsChart />
            </div>
          </div>
        </div>
      </div>

      {/* Email Template Modal */}
      {showTemplateModal && (
        <EmailTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          jobData={selectedJob}
        />
      )}
    </div>
  );
}
