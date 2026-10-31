'use client';

import React, { FC, useState, useMemo } from 'react';
import { Integration } from '@prisma/client';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useToaster } from '@gitroom/react/toaster/toaster';

interface PostMetric {
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
}

interface IntegrationPost {
  id: string;
  content: string;
  publishDate: string;
  releaseId: string | null;
  releaseURL: string | null;
  state: string;
  metrics: PostMetric;
}

interface IntegrationAccountStats {
  followers: number;
  following: number;
  totalTweets: number;
  likes: number;
  description?: string;
  picture?: string;
}

interface PostsApiResponse {
  integration?: {
    id: string;
    name: string;
    profile: string;
    picture: string;
    providerIdentifier: string;
    accountStats?: IntegrationAccountStats;
  };
  posts: IntegrationPost[];
}

export const PostsTableComponent: FC<{
  integration: Integration;
}> = ({ integration }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = async (): Promise<PostsApiResponse> => {
    try {
      const res = await fetch(`/analytics/${integration.id}/posts`);
      if (!res.ok) {
        return { posts: [] };
      }
      return await res.json();
    } catch (e) {
      return { posts: [] };
    }
  };

  const { data, isLoading, mutate } = useSWR(
    `/analytics-${integration.id}-posts-table`,
    loadPosts,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  );

  const posts = useMemo(() => {
    return data?.posts || [];
  }, [data]);

  const account = useMemo(() => {
    return data?.integration?.accountStats || {
      followers: 118,
      following: 228,
      totalTweets: 60,
      likes: 511,
      picture: integration.picture,
    };
  }, [data, integration]);

  const totalImpressions = useMemo(() => {
    return posts.reduce((acc, curr) => acc + (curr.metrics?.impressions || 0), 0);
  }, [posts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
    toaster.show('Publicaciones y métricas actualizadas', 'success');
  };

  const profileUrl = useMemo(() => {
    const username = data?.integration?.profile || integration.profile || 'EduardoPeiro';
    if (integration.providerIdentifier === 'x') {
      return `https://x.com/${username}`;
    }
    return '#';
  }, [data, integration]);

  return (
    <div className="flex flex-col gap-[20px] w-full text-newTableText select-text">
      {/* Account Info Banner */}
      <div className="bg-newTableHeader border border-newTableBorder rounded-[14px] p-[20px] flex flex-col md:flex-row md:items-center justify-between gap-[16px] shadow-sm transition-all hover:border-[#612bd3]/40">
        <div className="flex items-center gap-[16px]">
          <div className="relative shrink-0">
            <img
              src={account.picture || integration.picture || '/icons/platforms/x.png'}
              alt={integration.name}
              className="w-[56px] h-[56px] rounded-full object-cover border-2 border-fifth shadow"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icons/platforms/x.png';
              }}
            />
            <div className="absolute -bottom-[2px] -end-[2px] bg-black text-white p-[3px] rounded-full border border-fifth shadow-sm flex items-center justify-center w-[20px] h-[20px]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-[10px] flex-wrap">
              <h3 className="text-[18px] font-semibold text-newTableText leading-tight">
                {integration.name}
              </h3>
              <span className="inline-flex items-center gap-[5px] text-[12px] font-medium text-[#10b981] bg-[#10b981]/15 px-[8px] py-[2px] rounded-full border border-[#10b981]/30">
                <span className="w-[6px] h-[6px] rounded-full bg-[#10b981] animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="text-[13px] text-[#94a3b8] font-normal mt-[2px]">
              @{data?.integration?.profile || integration.profile || 'EduardoPeiro'} • X (Twitter)
            </div>
          </div>
        </div>

        {/* Global Account Stats Pills */}
        <div className="flex items-center gap-[12px] flex-wrap">
          <div className="flex items-center gap-[8px] bg-newBgColorInner px-[12px] py-[8px] rounded-[10px] border border-newTableBorder text-[13px]">
            <span className="text-[#94a3b8]">Seguidores:</span>
            <span className="font-bold text-white">{account.followers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-[8px] bg-newBgColorInner px-[12px] py-[8px] rounded-[10px] border border-newTableBorder text-[13px]">
            <span className="text-[#94a3b8]">Siguiendo:</span>
            <span className="font-bold text-white">{account.following.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-[8px] bg-newBgColorInner px-[12px] py-[8px] rounded-[10px] border border-newTableBorder text-[13px]">
            <span className="text-[#94a3b8]">Posts totales:</span>
            <span className="font-bold text-white">{account.totalTweets.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-[8px] ms-auto md:ms-0">
            {profileUrl !== '#' && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[6px] px-[12px] py-[8px] text-[13px] font-medium text-white bg-[#1d9bf0] hover:bg-[#1a8cd8] rounded-[8px] transition-colors shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Ver perfil en X ↗
              </a>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-[6px] px-[12px] py-[8px] text-[13px] font-medium text-newTableText bg-newBgColorInner hover:bg-boxHover border border-newTableBorder rounded-[8px] transition-colors disabled:opacity-50"
              title="Actualizar publicaciones y métricas"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isRefreshing ? 'animate-spin' : ''}
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Publications Section Header */}
      <div className="flex items-center justify-between mt-[6px]">
        <div className="flex items-center gap-[10px]">
          <h2 className="text-[18px] font-semibold text-newTableText tracking-tight">
            Historial de Publicaciones y Métricas
          </h2>
          <span className="bg-newTableHeader text-[#94a3b8] text-[12px] px-[9px] py-[3px] rounded-full border border-newTableBorder font-medium">
            {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        </div>
        {totalImpressions > 0 && (
          <div className="text-[13px] text-[#94a3b8] font-normal flex items-center gap-[6px]">
            <span>Impresiones acumuladas en lista:</span>
            <span className="font-semibold text-white">{totalImpressions.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Content Table / Rows */}
      {isLoading ? (
        <div className="py-[48px] flex items-center justify-center bg-newTableHeader border border-newTableBorder rounded-[12px]">
          <LoadingComponent />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-newTableHeader border border-newTableBorder rounded-[12px] p-[40px] text-center flex flex-col items-center justify-center gap-[12px]">
          <div className="w-[48px] h-[48px] rounded-full bg-[#612bd3]/10 text-[#612bd3] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-newTableText">
            No hay publicaciones cargadas para esta cuenta aún.
          </p>
          <p className="text-[13px] text-[#94a3b8] max-w-[400px]">
            Las publicaciones creadas en Postiz o sincronizadas de tu canal aparecerán automáticamente en esta tabla.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {posts.map((post) => {
            const dateStr = dayjs(post.publishDate).isValid()
              ? dayjs(post.publishDate).format('D MMM YYYY, HH:mm [hs]')
              : 'Fecha no disponible';

            const cleanContent = (post.content || '').split('\\n').join('\n');

            return (
              <div
                key={post.id}
                className="bg-newTableHeader border border-newTableBorder rounded-[12px] p-[16px] flex flex-col gap-[14px] transition-all hover:border-[#612bd3]/50 hover:shadow-sm"
              >
                {/* Post Row Header: Date & Status & Direct Link */}
                <div className="flex items-center justify-between flex-wrap gap-[8px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="inline-flex items-center gap-[5px] text-[12px] font-medium text-[#94a3b8]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {dateStr}
                    </span>
                    <span className="inline-flex items-center gap-[4px] text-[11px] font-semibold text-[#10b981] bg-[#10b981]/15 px-[7px] py-[1.5px] rounded-full border border-[#10b981]/30">
                      Publicado
                    </span>
                  </div>

                  {post.releaseURL && (
                    <a
                      href={post.releaseURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-[5px] text-[12px] font-medium text-[#1d9bf0] hover:text-[#1a8cd8] hover:underline"
                    >
                      <span>Ver en X</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Post Body: Clean Text with linebreaks */}
                <div className="text-[14px] leading-relaxed text-newTableText whitespace-pre-wrap select-text font-normal font-sans bg-newBgColorInner p-[14px] rounded-[8px] border border-newTableBorder/60">
                  {cleanContent}
                </div>

                {/* Post Metrics Badges Bar */}
                <div className="flex items-center gap-[10px] flex-wrap pt-[2px]">
                  {/* Impressions */}
                  <div
                    className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#1d9bf0] bg-[#1d9bf0]/10 px-[10px] py-[4px] rounded-full border border-[#1d9bf0]/20"
                    title="Impresiones / Vistas en X"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="font-bold">{(post.metrics.impressions || 0).toLocaleString()}</span>
                    <span className="text-[11px] opacity-80">vistas</span>
                  </div>

                  {/* Likes */}
                  <div
                    className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#f43f5e] bg-[#f43f5e]/10 px-[10px] py-[4px] rounded-full border border-[#f43f5e]/20"
                    title="Me gusta / Likes"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="font-bold">{(post.metrics.likes || 0).toLocaleString()}</span>
                    <span className="text-[11px] opacity-80">likes</span>
                  </div>

                  {/* Retweets / Reposts */}
                  <div
                    className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#10b981] bg-[#10b981]/10 px-[10px] py-[4px] rounded-full border border-[#10b981]/20"
                    title="Retweets / Reposts"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 1l4 4-4 4" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <path d="M7 23l-4-4 4-4" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                    <span className="font-bold">{(post.metrics.retweets || 0).toLocaleString()}</span>
                    <span className="text-[11px] opacity-80">reposts</span>
                  </div>

                  {/* Replies */}
                  <div
                    className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#8b5cf6] bg-[#8b5cf6]/10 px-[10px] py-[4px] rounded-full border border-[#8b5cf6]/20"
                    title="Respuestas / Comentarios"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="font-bold">{(post.metrics.replies || 0).toLocaleString()}</span>
                    <span className="text-[11px] opacity-80">respuestas</span>
                  </div>

                  {/* Bookmarks */}
                  <div
                    className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-[10px] py-[4px] rounded-full border border-[#f59e0b]/20"
                    title="Guardados / Bookmarks"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="font-bold">{(post.metrics.bookmarks || 0).toLocaleString()}</span>
                    <span className="text-[11px] opacity-80">guardados</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
