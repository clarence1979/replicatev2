import { AlertTriangle, Shield, Eye } from 'lucide-react';

interface TermsOfServiceProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function TermsOfService({ onClose, showCloseButton = true }: TermsOfServiceProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">Terms and Conditions of Use</h2>
        <p className="text-sm text-gray-600 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="px-6 py-4 space-y-6">
        <section className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Important Warnings</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span><strong>Renowned People:</strong> AI generation may fail or produce poor results when using images of famous people, celebrities, or public figures due to content policy restrictions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span><strong>Permission Required:</strong> You must obtain explicit permission from any person before using their photographs, images, or likeness in AI generation. Using another person's media without permission is prohibited.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Monitoring and Supervision</h3>
              <p className="text-sm text-gray-700">
                <strong>All media generations are monitored and logged.</strong> This includes all inputs, prompts, uploaded files, and generated outputs. This monitoring is in place to ensure appropriate use, maintain safety, and comply with school policies.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Acceptable Use Policy
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>By using this service, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the service only for educational purposes</li>
              <li>Respect copyright and intellectual property rights</li>
              <li>Not generate content that is offensive, harmful, or inappropriate</li>
              <li>Not generate content depicting violence, illegal activities, or explicit material</li>
              <li>Not attempt to bypass content filters or safety measures</li>
              <li>Obtain permission before using any person's image or likeness</li>
              <li>Use your real name when logging in and creating content</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Educational Context</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>This tool is provided for educational purposes within an Australian school setting. As such:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All use must comply with school ICT policies and guidelines</li>
              <li>Teachers and school administrators have access to all generated content</li>
              <li>Content may be reviewed as part of assessment or moderation</li>
              <li>The school reserves the right to suspend or terminate access for policy violations</li>
              <li>Students are responsible for ensuring their use complies with Australian law</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Content Ownership and Rights</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You retain ownership of content you create using this tool</li>
              <li>The school has the right to use generated content for educational purposes</li>
              <li>AI-generated content may not be eligible for copyright protection</li>
              <li>You are responsible for ensuring all inputs (prompts, images, audio) comply with copyright law</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Data Retention</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>Generated content and associated metadata will be:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Stored securely for the duration of the school year</li>
              <li>Automatically deleted after a retention period (typically 1 hour to 1 year)</li>
              <li>Accessible to authorized school staff for monitoring and educational purposes</li>
              <li>Subject to the school's data retention and disposal policies</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Consequences of Misuse</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>Violation of these terms may result in:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Immediate suspension of access to the service</li>
              <li>Disciplinary action in accordance with school policies</li>
              <li>Notification to parents/guardians</li>
              <li>Reporting to appropriate authorities if illegal activity is suspected</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Third-Party Services</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>This service uses Replicate.com API for AI generation. By using this service, you acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your content may be processed by third-party AI services</li>
              <li>Third-party services have their own terms of service and privacy policies</li>
              <li>The school is not responsible for the actions or policies of third-party services</li>
              <li>Generated content quality and availability depend on third-party service performance</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Disclaimer</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>AI-generated content may contain errors or inaccuracies</li>
              <li>The service is provided "as is" without warranty of any kind</li>
              <li>The school is not liable for any damages arising from use of this service</li>
              <li>Service availability is not guaranteed and may be interrupted</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Changes to Terms</h3>
          <div className="text-sm text-gray-700">
            <p>The school reserves the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes. Users will be notified of significant changes to these terms.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Contact</h3>
          <div className="text-sm text-gray-700">
            <p>If you have questions about these terms, please contact your teacher or school ICT coordinator.</p>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-4 mt-6">
          <p className="text-sm text-gray-600 italic">
            By clicking "I Accept" or using this service, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions of Use.
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
