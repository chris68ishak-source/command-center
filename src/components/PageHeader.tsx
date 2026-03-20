interface PageHeaderProps {
  icon: string;
  title: string;
  description: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-gray-800 px-8 py-6">
      <h1 className="text-lg font-bold text-white flex items-center gap-2">
        <span>{icon}</span> {title}
      </h1>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}
