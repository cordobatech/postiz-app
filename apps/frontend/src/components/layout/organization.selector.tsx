'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import clsx from 'clsx';

export const OrganizationSelector: FC<{ asOpenSelect?: boolean }> = ({
  asOpenSelect,
}) => {
  const fetch = useFetch();
  const user = useUser();
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    return await (await fetch('/user/organizations')).json();
  }, []);

  const { isLoading, data } = useSWR('organizations', load, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnReconnect: false,
  });

  const current = useMemo(() => {
    return data?.find((d: any) => d.id === user?.orgId);
  }, [data, user?.orgId]);

  const withoutCurrent = useMemo(() => {
    return data?.filter((d: any) => d.id !== user?.orgId);
  }, [current, data, user?.orgId]);

  const changeOrg = useCallback(
    (org: { name: string; id: string }) => async () => {
      await fetch('/user/change-org', {
        method: 'POST',
        body: JSON.stringify({
          id: org.id,
        }),
      });
      window.location.reload();
    },
    []
  );

  const handleCreateOrg = useCallback(async () => {
    const name = window.prompt(
      'Nombre del nuevo proyecto o empresa (ej: Aprender21, MegaContainers, POS1 Agency):'
    );
    if (!name || !name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/user/create-org', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Error al crear el proyecto.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al crear proyecto.');
    } finally {
      setCreating(false);
    }
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="hover:text-newTextColor">
        <div className="group text-[12px] relative cursor-pointer">
          {asOpenSelect && (
            <div className="bg-btnPrimary !flex !relative max-w-[500px] mx-auto py-[12px] px-[12px]">
              Select Organization
            </div>
          )}
          {!asOpenSelect && (
            <div className="flex items-center gap-[6px] py-[4px] px-[8px] rounded-[6px] hover:bg-third transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-forth"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01" />
                <path d="M9 12v.01" />
                <path d="M9 15v.01" />
                <path d="M9 18v.01" />
              </svg>
              <div className="max-w-[180px] truncate font-medium mobile:hidden">
                {current?.name || 'Proyectos'}
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-60"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          )}
          <div
            className={clsx(
              "hidden py-[12px] px-[12px] group-hover:flex absolute top-[100%] end-0 min-w-[220px] max-w-[400px] bg-third border-tableBorder border rounded-[8px] shadow-2xl gap-[10px] flex-col z-[100]",
              asOpenSelect ? "!flex !relative max-w-[500px] mx-auto mb-[10px]" : ""
            )}
          >
            <div className="text-[10px] uppercase font-bold text-customColor18 tracking-wider pb-[4px] border-b border-tableBorder">
              Proyectos / Empresas
            </div>
            <div className="text-white font-semibold flex items-center justify-between">
              <span className="truncate">{current?.name}</span>
              <span className="text-[10px] bg-forth/20 text-forth px-[6px] py-[2px] rounded">
                Activo
              </span>
            </div>
            {withoutCurrent?.map(
              (org: {
                name: string;
                id: string;
                users: { role: 'SUPERADMIN' | 'ADMIN' | 'USER' }[];
              }) => (
                <div
                  key={org?.id}
                  onClick={changeOrg(org)}
                  className="whitespace-nowrap truncate hover:text-forth transition-colors py-[4px] cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{org?.name}</span>
                  {!!org?.users?.[0]?.role && (
                    <span className="text-[10px] text-customColor18">
                      {org?.users?.[0]?.role === 'SUPERADMIN'
                        ? 'Super-Admin'
                        : org?.users?.[0]?.role === 'ADMIN'
                        ? 'Admin'
                        : 'User'}
                    </span>
                  )}
                </div>
              )
            )}
            <div
              onClick={handleCreateOrg}
              className="text-[#10b981] hover:text-[#34d399] font-medium pt-[8px] border-t border-tableBorder flex items-center gap-[6px] cursor-pointer transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>{creating ? 'Creando...': '+ Crear nuevo proyecto'}</span>
            </div>
          </div>
        </div>
      </div>
      {!asOpenSelect && (
        <div className="w-[1px] h-[20px] bg-blockSeparator mobile:hidden" />
      )}
    </>
  );
};
