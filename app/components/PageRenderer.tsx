// components/PageRenderer.tsx
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { COMPONENT_REGISTRY } from './registry';

export function PageRenderer({ page }) {
  return (
    <div className="flex flex-col gap-16">
      {page.slots.map((slot, index) => {
        const Component = COMPONENT_REGISTRY[slot.component_id];

        if (!Component) {
          return (
            <div key={index} className="text-red-500">
              Componente no encontrado: {slot.component_id}
            </div>
          );
        }

        return (
          <section key={index} className="container mx-auto">
            <Component {...slot.props} />
          </section>
        );
      })}
    </div>
  );
}
