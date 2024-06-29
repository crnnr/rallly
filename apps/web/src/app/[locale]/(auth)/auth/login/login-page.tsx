"use client";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { UserAvatar } from "@/components/user";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

type PageProps = { magicLink: string; email: string };

export const LoginPage = ({ magicLink, email }: PageProps) => {
  const session = useSession();
  const posthog = usePostHog();
  const trpcUtils = trpc.useUtils();
  const magicLinkFetch = useMutation({
    mutationFn: async () => {
      const res = await fetch(magicLink);
      return res;
    },
    onSuccess: async (data) => {
      if (!data.url.includes("auth/error")) {
        // if login was successful, update the session
        const updatedSession = await session.update();
        if (updatedSession) {
          // identify the user in posthog
          posthog?.identify(updatedSession.user.id, {
            email: updatedSession.user.email,
            name: updatedSession.user.name,
          });

          await trpcUtils.invalidate();
        }
      }

      router.push(data.url);
    },
  });
  const { data } = trpc.user.getByEmail.useQuery({ email });
  const router = useRouter();
  return (
    <Card className="mx-auto w-56">
      <div className="space-y-4 p-6">
        <div className="text-center">
          <UserAvatar size="lg" name={data?.name} />
          <div className="mt-4 text-center">
            <div className="mb-1 h-6 font-medium">
              {data?.name ?? <Skeleton className="inline-block h-5 w-16" />}
            </div>
            <div className="text-muted-foreground h-5 truncate text-sm">
              {data?.email ?? <Skeleton className="inline-block h-full w-20" />}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t bg-gray-50 p-4">
        <Button
          loading={magicLinkFetch.isLoading}
          onClick={async () => {
            await magicLinkFetch.mutateAsync();
          }}
          variant="primary"
          className="w-full"
        >
          <Trans i18nKey="continue" />
        </Button>
      </div>
    </Card>
  );
};
