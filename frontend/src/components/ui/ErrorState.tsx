import { Callout } from "./Callout";

export function ErrorState({ message }: { message: string }) {
  return (
    <Callout variant="critical" title="Something went wrong">
      {message}
    </Callout>
  );
}
