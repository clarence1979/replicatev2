import { Shield, Lock, Database, Eye } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function PrivacyPolicy({ onClose, showCloseButton = true }: PrivacyPolicyProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
        <p className="text-sm text-gray-600 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="px-6 py-4 space-y-6">
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Introduction
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use this AI generation tool. This policy applies to all students, teachers, and staff using this service within our Australian school setting.
            </p>
            <p>
              We are committed to protecting your privacy and complying with the Australian Privacy Principles under the Privacy Act 1988 (Cth) and the Australian Education Data Standards.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Information We Collect
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-semibold">Personal Information:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Student name (first name or full name)</li>
              <li>Timestamp of activity</li>
              <li>Device information (browser type, operating system)</li>
            </ul>

            <p className="font-semibold mt-3">Usage Data:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>AI model selections and parameters</li>
              <li>Text prompts submitted for generation</li>
              <li>Images, videos, or audio files uploaded</li>
              <li>Generated outputs (images, videos, audio, text)</li>
              <li>API usage statistics and costs</li>
              <li>Error logs and technical diagnostics</li>
            </ul>

            <p className="font-semibold mt-3">Stored Locally:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>API keys (if "Remember Me" is selected)</li>
              <li>Student name (if "Remember Me" is selected)</li>
              <li>These are stored in your browser's local storage only</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            How We Use Your Information
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>We use collected information for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Educational purposes:</strong> To facilitate learning and assessment</li>
              <li><strong>Service provision:</strong> To process AI generation requests</li>
              <li><strong>Safety monitoring:</strong> To ensure appropriate and safe use of the service</li>
              <li><strong>Technical support:</strong> To diagnose and resolve technical issues</li>
              <li><strong>Record keeping:</strong> To maintain records in accordance with school policies</li>
              <li><strong>Compliance:</strong> To comply with legal and regulatory requirements</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Who Can Access Your Information</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>Your information may be accessed by:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Your teachers:</strong> For educational and assessment purposes</li>
              <li><strong>School administrators:</strong> For oversight and policy compliance</li>
              <li><strong>ICT staff:</strong> For technical support and system maintenance</li>
              <li><strong>Authorized personnel:</strong> In cases of safety concerns or policy violations</li>
            </ul>

            <p className="mt-3 font-semibold">Third-Party Processing:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Replicate.com:</strong> Your prompts and uploaded media are sent to Replicate's API for AI processing. Replicate has their own privacy policy which you should review.</li>
              <li><strong>AI Model Providers:</strong> Various AI models (Stability AI, OpenAI, Anthropic, etc.) may process your content according to their privacy policies.</li>
              <li><strong>Supabase:</strong> Metadata and generation records are stored using Supabase database services.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Data Security
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>We implement appropriate security measures to protect your information:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Encrypted transmission of data (HTTPS/TLS)</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Limited access based on role and necessity</li>
              <li>Automatic deletion of temporary files after a defined period</li>
            </ul>
            <p className="mt-3 italic">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Data Retention</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Generated files:</strong> Automatically deleted after 1 hour (temporary storage)</li>
              <li><strong>Generation records:</strong> Retained for the current school year</li>
              <li><strong>Activity logs:</strong> Retained according to school record-keeping policies</li>
              <li><strong>Student records:</strong> Managed according to school and educational authority requirements</li>
            </ul>
            <p className="mt-3">
              At the end of each school year or upon graduation/departure, student data is archived or deleted in accordance with the school's data retention policy.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Your Rights</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>Under Australian privacy law, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
              <li><strong>Complaint:</strong> Lodge a complaint if you believe your privacy has been breached</li>
            </ul>
            <p className="mt-3">
              For students under 18, these rights are typically exercised by parents or guardians. Contact your teacher or school privacy officer to exercise these rights.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Parental Access</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              Parents and guardians have the right to access their child's information stored by this service. Requests should be made through the school's normal channels for accessing student records.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Changes to This Policy</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted with an updated date. Significant changes will be communicated to users through school communication channels.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Complaints and Concerns</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>If you have concerns about how your personal information is handled, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Contact your teacher or school privacy officer</li>
              <li>Contact the school principal</li>
              <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>For privacy-related questions or concerns, please contact:</p>
            <ul className="list-none space-y-1 ml-4">
              <li><strong>School Privacy Officer:</strong> [Contact details to be provided by school]</li>
              <li><strong>ICT Coordinator:</strong> [Contact details to be provided by school]</li>
            </ul>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-4 mt-6">
          <p className="text-sm text-gray-600 italic">
            By using this service, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>

      {showCloseButton && (
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
