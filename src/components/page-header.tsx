import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-12 space-y-4", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-accent rounded-full" />
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 uppercase">
            {title}
          </h1>
        </div>
      </div>
      {description && (
        <p className="text-lg text-slate-500 font-medium pl-4 leading-relaxed max-w-3xl border-l-2 border-slate-200">
          {description}
        </p>
      )}
    </div>
  );
}
