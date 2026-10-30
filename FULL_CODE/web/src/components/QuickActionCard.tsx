import { UserPlus, FileCheck2, ShieldAlert, ArrowRight, Zap } from 'lucide-react';

interface QuickActionCardProps {
  onAddPatient: () => void;
  onReviewMedication: () => void;
  onViewSafetyAlerts: () => void;
}

export const QuickActionCard = ({
  onAddPatient,
  onReviewMedication,
  onViewSafetyAlerts,
}: QuickActionCardProps) => {
  const actions = [
    {
      id: 'add-patient',
      title: 'Add Patient',
      description: 'Register patient admission and demographics',
      icon: <UserPlus className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      buttonText: 'Open Form',
      onClick: onAddPatient,
    },
    {
      id: 'review-medication',
      title: 'Review Medication',
      description: 'Perform clinical verification on pending orders',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      buttonText: 'Start Review',
      onClick: onReviewMedication,
    },
    {
      id: 'view-safety-alerts',
      title: 'View Safety Alerts',
      description: 'Investigate drug-drug & dosage contraindications',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      buttonText: 'Open Alerts',
      onClick: onViewSafetyAlerts,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-1.5 bg-blue-50 text-[#17324D] rounded-lg">
          <Zap className="w-4 h-4 text-[#168C83]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#17324D]">Quick Actions</h3>
          <p className="text-xs text-slate-500">Rapid hospital workflow shortcuts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {actions.map((act) => (
          <div
            key={act.id}
            onClick={act.onClick}
            className="group p-3.5 rounded-lg border border-slate-200 hover:border-[#168C83]/50 hover:bg-[#F4F6F8]/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start space-x-3 mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${act.iconBg}`}
              >
                {act.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17324D] group-hover:text-[#168C83] transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {act.description}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-[#168C83] group-hover:text-[#12726B]">
              <span>{act.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActionCard;
