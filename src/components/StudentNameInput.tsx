import { User } from 'lucide-react';

interface StudentNameInputProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  onRememberName: () => void;
  onForgetName: () => void;
  isRemembered: boolean;
}

export function StudentNameInput({
  studentName,
  onStudentNameChange,
  onRememberName,
  onForgetName,
  isRemembered
}: StudentNameInputProps) {
  return (
    <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-blue-600" />
        <label htmlFor="studentName" className="text-sm font-medium text-gray-700">
          Student Name:
        </label>
        <input
          type="text"
          id="studentName"
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Enter your first name"
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          required
        />
        {studentName.trim() && !isRemembered && (
          <button
            onClick={onRememberName}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Remember Me
          </button>
        )}
        {isRemembered && (
          <button
            onClick={onForgetName}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Forget Me
          </button>
        )}
      </div>
    </div>
  );
}
