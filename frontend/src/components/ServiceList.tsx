import type { Service } from "../types";

interface Props {
  services: Service[];
  onAdd: (serviceId: string) => void;
}

export function ServiceList({ services, onAdd }: Props) {
  return (
    <ul className="divide-y divide-slate-200">
      {services.map((service) => (
        <li key={service.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{service.name}</p>
            <p className="text-sm text-slate-500">
              {service.type} · provider {service.providerId}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="whitespace-nowrap text-sm font-medium">฿{service.price}</span>
            <button
              onClick={() => onAdd(service.id)}
              className="min-h-11 rounded-lg bg-teal-700 px-4 font-medium text-white active:bg-teal-800"
            >
              Add
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}