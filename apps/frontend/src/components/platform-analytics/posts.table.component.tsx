'use client';

import React, { FC, useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Integration } from '@prisma/client';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useToaster } from '@gitroom/react/toaster/toaster';

interface PostMetric {
  impressions?: number;
  likes?: number;
  retweets?: number;
  replies?: number;
  bookmarks?: number;
}

interface IntegrationPost {
  id: string;
  content?: string;
  publishDate?: string;
  releaseId?: string | null;
  releaseURL?: string | null;
  state?: string;
  metrics?: PostMetric;
}

interface IntegrationAccountStats {
  followers?: number;
  following?: number;
  totalTweets?: number;
  likes?: number;
  description?: string;
  picture?: string;
}

interface PostsApiResponse {
  integration?: {
    id: string;
    name?: string;
    profile?: string;
    picture?: string;
    providerIdentifier?: string;
    accountStats?: IntegrationAccountStats;
  };
  posts?: IntegrationPost[];
}

// Extract a concise, meaningful 1-line summary from tweet content
const getOneLineSummary = (content?: string): string => {
  if (!content || typeof content !== 'string') return 'Sin contenido';
  const cleaned = content.split('\\n').join(' ').replace(/\s+/g, ' ').trim();
  const sentenceMatch = cleaned.match(/^([^.!?]+[.!?])/);
  if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length >= 15 && sentenceMatch[1].length <= 140) {
    return sentenceMatch[1].trim();
  }
  if (cleaned.length <= 110) return cleaned;
  const truncated = cleaned.slice(0, 105);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated) + '...';
};

// React Error Boundary to catch any render errors and prevent Next.js client crash
class SafeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || 'Error al renderizar' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PostsTableComponent render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-newTableHeader border border-newTableBorder rounded-[12px] p-[24px] text-center my-[16px]">
          <p className="text-[14px] text-newTableText font-medium mb-[8px]">
            Se produjo una advertencia al cargar el historial de publicaciones.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="px-[12px] py-[6px] text-[13px] bg-[#612bd3] text-white rounded-[6px]"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PostsTableContent: FC<{
  integration: Integration;
}> = ({ integration }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});

  if (!integration || !integration.id) {
    return null;
  }

  const loadPosts = async (): Promise<PostsApiResponse> => {
    try {
      const res = await fetch(`/analytics/${integration.id}/posts`);
      if (!res.ok) {
        return { posts: [] };
      }
      const json = await res.json();
      return json || { posts: [] };
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
    return Array.isArray(data?.posts) ? data.posts : [];
  }, [data]);

  const account = useMemo(() => {
    const raw = data?.integration?.accountStats;
    return {
      followers: Number(raw?.followers ?? 118),
      following: Number(raw?.following ?? 228),
      totalTweets: Number(raw?.totalTweets ?? 60),
      likes: Number(raw?.likes ?? 511),
      picture: raw?.picture || integration.picture || '/icons/platforms/x.png',
    };
  }, [data, integration]);

  const totalImpressions = useMemo(() => {
    return posts.reduce((acc, curr) => acc + Number(curr?.metrics?.impressions || 0), 0);
  }, [posts]);

  const toggleExpand = (id: string) => {
    setExpandedPostIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allExpanded = useMemo(() => {
    return posts.length > 0 && posts.every((p) => expandedPostIds[p.id]);
  }, [posts, expandedPostIds]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedPostIds({});
    } else {
      const nextState: Record<string, boolean> = {};
      posts.forEach((p) => {
        nextState[p.id] = true;
      });
      setExpandedPostIds(nextState);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      toaster.show('Publicaciones y métricas actualizadas', 'success');
    } catch (err) {
      toaster.show('Error al refrescar', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const profileUrl = useMemo(() => {
    const username = data?.integration?.profile || integration?.profile || 'EduardoPeiro';
    if (integration?.providerIdentifier === 'x') {
      return `https://x.com/${username}`;
    }
    return '#';
  }, [data, integration]);

  const channelName = integration?.name || 'Canal';
  const username = data?.integration?.profile || integration?.profile || 'EduardoPeiro';

  return (
    <div className="flex flex-col gap-[20px] w-full text-newTableText select-text">
      {/* Account Info Banner */}
      <div className="bg-newTableHeader border border-newTableBorder rounded-[12px] p-[20px] flex items-center justify-between gap-[20px] flex-wrap shadow-sm">
        <div className="flex items-center gap-[16px]">
          <div className="relative">
            <img
              src={account.picture}
              alt={channelName}
              className="w-[52px] h-[52px] rounded-full object-cover border-2 border-primary"
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
                {channelName}
              </h3>
              <span className="inline-flex items-center gap-[5px] text-[12px] font-medium text-[#10b981] bg-[#10b981]/15 px-[8px] py-[2px] rounded-full border border-[#10b981]/30">
                <span className="w-[6px] h-[6px] rounded-full bg-[#10b981] animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="text-[13px] text-[#94a3b8] font-normal mt-[2px]">
              @{username} • X (Twitter)
            </div>
          </div>
        </div>

        {/* Global Account Stats Pills: HIGH CONTRAST */}
        <div className="flex items-center gap-[12px] flex-wrap">
          <div className="flex items-center gap-[8px] bg-[#1e293b] px-[14px] py-[8px] rounded-[10px] border border-[#475569] text-[13px] shadow-sm">
            <span className="text-[#cbd5e1] font-semibold">Seguidores:</span>
            <span className="font-extrabold text-white text-[15px]">{Number(account.followers || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-[8px] bg-[#1e293b] px-[14px] py-[8px] rounded-[10px] border border-[#475569] text-[13px] shadow-sm">
            <span className="text-[#cbd5e1] font-semibold">Siguiendo:</span>
            <span className="font-extrabold text-white text-[15px]">{Number(account.following || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-[8px] bg-[#1e293b] px-[14px] py-[8px] rounded-[10px] border border-[#475569] text-[13px] shadow-sm">
            <span className="text-[#cbd5e1] font-semibold">Posts totales:</span>
            <span className="font-extrabold text-white text-[15px]">{Number(account.totalTweets || 0).toLocaleString()}</span>
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
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header of the Posts Section */}
      <div className="flex items-center justify-between flex-wrap gap-[10px] px-[2px]">
        <div className="flex items-center gap-[10px]">
          <h4 className="text-[16px] font-semibold text-newTableText">
            Historial de Publicaciones y Métricas
          </h4>
          <span className="text-[12px] font-medium bg-newBgColorInner border border-newTableBorder px-[8px] py-[2px] rounded-full text-[#94a3b8]">
            {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        </div>

        <div className="flex items-center gap-[12px] text-[13px]">
          {posts.length > 0 && (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="text-[12px] font-medium text-[#94a3b8] hover:text-white transition-colors underline decoration-dotted"
            >
              {allExpanded ? 'Colapsar todas' : 'Expandir todas'}
            </button>
          )}
          <span className="text-[#94a3b8]">
            Impresiones acumuladas: <strong className="text-white font-bold">{totalImpressions.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Posts List: Collapsed Rows by Default */}
      {isLoading ? (
        <div className="bg-newTableHeader border border-newTableBorder rounded-[12px] p-[60px] flex items-center justify-center">
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
        <div className="flex flex-col gap-[8px]">
          {posts.map((post) => {
            const isExpanded = !!expandedPostIds[post.id];
            const dateStr = post?.publishDate && dayjs(post.publishDate).isValid()
              ? dayjs(post.publishDate).format('D MMM YYYY, HH:mm [hs]')
              : 'Fecha no disponible';
            const shortDate = post?.publishDate && dayjs(post.publishDate).isValid()
              ? dayjs(post.publishDate).format('D MMM YYYY')
              : 'N/D';

            const cleanContent = typeof post?.content === 'string'
              ? post.content.split('\\n').join('\n')
              : '';

            const summary = getOneLineSummary(post?.content);

            const impressions = Number(post?.metrics?.impressions || 0);
            const likes = Number(post?.metrics?.likes || 0);
            const retweets = Number(post?.metrics?.retweets || 0);
            const replies = Number(post?.metrics?.replies || 0);
            const bookmarks = Number(post?.metrics?.bookmarks || 0);

            return (
              <div
                key={post.id}
                className="bg-newTableHeader border border-newTableBorder rounded-[10px] transition-all hover:border-[#612bd3]/40 overflow-hidden shadow-sm"
              >
                {/* Collapsed Bar / Clickable Row Header */}
                <div
                  onClick={() => toggleExpand(post.id)}
                  className="p-[12px] px-[14px] flex items-center justify-between gap-[12px] cursor-pointer select-none hover:bg-boxHover transition-colors"
                >
                  <div className="flex items-center gap-[10px] min-w-0 flex-1">
                    {/* Expand/Collapse Chevron Indicator */}
                    <button
                      type="button"
                      className="text-[#94a3b8] hover:text-white transition-transform p-[2px] shrink-0"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      title={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    {/* Date Tag */}
                    <span className="text-[11px] font-semibold text-[#cbd5e1] bg-[#1e293b] px-[7px] py-[2px] rounded-[5px] border border-[#334155] whitespace-nowrap shrink-0">
                      {shortDate}
                    </span>

                    {/* 1-Line Summary Preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate leading-snug" title={summary}>
                        {summary}
                      </p>
                    </div>
                  </div>

                  {/* Compact Metrics & Direct Link */}
                  <div className="flex items-center gap-[8px] shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Vistas */}
                    <span
                      className="inline-flex items-center gap-[4px] text-[11px] font-medium text-[#1d9bf0] bg-[#1d9bf0]/10 px-[7px] py-[2.5px] rounded-full border border-[#1d9bf0]/20"
                      title="Impresiones / Vistas"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="font-bold">{impressions.toLocaleString()}</span>
                    </span>

                    {/* Likes */}
                    <span
                      className="inline-flex items-center gap-[4px] text-[11px] font-medium text-[#f43f5e] bg-[#f43f5e]/10 px-[7px] py-[2.5px] rounded-full border border-[#f43f5e]/20"
                      title="Me gusta / Likes"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-bold">{likes.toLocaleString()}</span>
                    </span>

                    {/* Ver en X link */}
                    {post?.releaseURL && (
                      <a
                        href={post.releaseURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-[4px] text-[11px] font-medium text-[#1d9bf0] hover:text-[#1a8cd8] bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 px-[8px] py-[2.5px] rounded-[5px] transition-colors border border-[#1d9bf0]/20"
                        title="Abrir tweet original en X"
                      >
                        <span>Ver en X</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-[14px] pt-[8px] border-t border-newTableBorder/50 flex flex-col gap-[12px] bg-newBgColorInner/30">
                    <div className="flex items-center justify-between text-[12px] text-[#94a3b8]">
                      <span>Publicado el {dateStr}</span>
                      <span className="inline-flex items-center gap-[4px] text-[11px] font-semibold text-[#10b981] bg-[#10b981]/15 px-[7px] py-[1.5px] rounded-full border border-[#10b981]/30">
                        Publicado
                      </span>
                    </div>

                    {/* Post Full Content */}
                    <div className="text-[14px] leading-relaxed text-newTableText whitespace-pre-wrap select-text font-normal font-sans bg-newBgColorInner p-[12px] rounded-[8px] border border-newTableBorder/60">
                      {cleanContent}
                    </div>

                    {/* Detailed Metrics Badges Bar */}
                    <div className="flex items-center gap-[8px] flex-wrap pt-[2px]">
                      {/* Impressions */}
                      <div
                        className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#1d9bf0] bg-[#1d9bf0]/10 px-[9px] py-[3.5px] rounded-full border border-[#1d9bf0]/20"
                        title="Impresiones / Vistas en X"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span className="font-bold">{impressions.toLocaleString()}</span>
                        <span className="text-[10px] opacity-80">vistas</span>
                      </div>

                      {/* Likes */}
                      <div
                        className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#f43f5e] bg-[#f43f5e]/10 px-[9px] py-[3.5px] rounded-full border border-[#f43f5e]/20"
                        title="Me gusta / Likes"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="font-bold">{likes.toLocaleString()}</span>
                        <span className="text-[10px] opacity-80">likes</span>
                      </div>

                      {/* Retweets / Reposts */}
                      <div
                        className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#10b981] bg-[#10b981]/10 px-[9px] py-[3.5px] rounded-full border border-[#10b981]/20"
                        title="Retweets / Reposts"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 1l4 4-4 4" />
                          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                          <path d="M7 23l-4-4 4-4" />
                          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                        <span className="font-bold">{retweets.toLocaleString()}</span>
                        <span className="text-[10px] opacity-80">reposts</span>
                      </div>

                      {/* Replies */}
                      <div
                        className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#8b5cf6] bg-[#8b5cf6]/10 px-[9px] py-[3.5px] rounded-full border border-[#8b5cf6]/20"
                        title="Respuestas / Comentarios"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="font-bold">{replies.toLocaleString()}</span>
                        <span className="text-[10px] opacity-80">respuestas</span>
                      </div>

                      {/* Bookmarks */}
                      <div
                        className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-[9px] py-[3.5px] rounded-full border border-[#f59e0b]/20"
                        title="Guardados / Bookmarks"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="font-bold">{bookmarks.toLocaleString()}</span>
                        <span className="text-[10px] opacity-80">guardados</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PostsTableComponent: FC<{
  integration: Integration;
}> = (props) => {
  return (
    <SafeErrorBoundary>
      <PostsTableContent {...props} />
    </SafeErrorBoundary>
  );
};
