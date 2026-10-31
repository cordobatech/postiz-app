import { FC, useCallback, useMemo, useState } from 'react';
import { Integration } from '@prisma/client';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { ChartSocial } from '@gitroom/frontend/components/analytics/chart-social';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { PostsTableComponent } from './posts.table.component';

interface AnalyticsDataItem {
  label: string;
  data: Array<{ total: number; date: string }>;
  average?: boolean;
  percentageChange?: number;
}

const TrendIndicator: FC<{ value: number; average?: boolean }> = ({
  value,
  average,
}) => {
  if (value === 0) return null;

  const isPositive = value > 0;
  const displayValue = Math.abs(value).toFixed(1);

  return (
    <div
      className={`flex items-center gap-[4px] text-[13px] font-medium ${
        isPositive ? 'text-[#32d583]' : 'text-[#f97066]'
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={isPositive ? '' : 'rotate-180'}
      >
        <path
          d="M6 2.5L10 7.5H2L6 2.5Z"
          fill="currentColor"
        />
      </svg>
      <span>
        {displayValue}
        {average ? 'pp' : '%'}
      </span>
    </div>
  );
};

const AnalyticsCard: FC<{
  item: AnalyticsDataItem;
  total: string | number;
  index: number;
}> = ({ item, total, index }) => {
  const colorVariants = ['purple', 'green', 'blue'] as const;
  const color = colorVariants[index % colorVariants.length];

  const hasDataPoints = item.data.length >= 1;

  return (
    <div className="group relative">
      <div
        className="flex flex-col h-full bg-newTableHeader border border-newTableBorder rounded-[12px] overflow-hidden transition-all duration-200 hover:border-[#612bd3]/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] pt-[14px] pb-[8px]">
          <div className="flex items-center gap-[10px]">
            <div
              className={`w-[8px] h-[8px] rounded-full ${
                color === 'purple' ? 'bg-[#612bd3]' : ''
              } ${color === 'green' ? 'bg-[#32d583]' : ''} ${
                color === 'blue' ? 'bg-[#1d9bf0]' : ''
              }`}
            />
            <span className="text-[15px] font-medium text-newTableText">
              {item.label}
            </span>
          </div>
          {item.percentageChange !== undefined && (
            <TrendIndicator value={item.percentageChange} average={item.average} />
          )}
        </div>

        {/* Content */}
        {hasDataPoints ? (
          <>
            {/* Chart */}
            <div className="flex-1 px-[12px] py-[8px]">
              <div className="h-[120px] relative">
                <ChartSocial data={item.data} color={color} key={`chart-${index}`} />
              </div>
            </div>

            {/* Value */}
            <div className="px-[16px] pb-[14px]">
              <div className="text-[36px] leading-[42px] font-semibold tracking-tight">
                {total}
              </div>
            </div>
          </>
        ) : (
          /* Single value display */
          <div className="flex-1 flex flex-col items-center justify-center py-[32px] px-[16px]">
            <div className="text-[48px] leading-[56px] font-semibold tracking-tight">
              {total}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const RenderAnalytics: FC<{
  integration: Integration;
  date: number;
}> = (props) => {
  const { integration, date } = props;
  const [loading, setLoading] = useState(true);
  const fetch = useFetch();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/analytics/${integration.id}?date=${date}`);
      if (!res.ok) {
        setLoading(false);
        return [];
      }
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      return [];
    }
  }, [integration, date]);

  const { data } = useSWR(`/analytics-${integration?.id}-${date}`, load, {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    revalidateOnMount: true,
  });

  const totals = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((p: AnalyticsDataItem) => {
      const value =
        (p?.data?.reduce((acc: number, curr: { total: number }) => acc + curr.total, 0) || 0) /
        (p.average ? (p.data.length || 1) : 1);
      if (p.average) {
        return value.toFixed(2) + '%';
      }
      return new Intl.NumberFormat().format(Math.round(value));
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[48px]">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {data && Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {data.map((item: AnalyticsDataItem, index: number) => (
            <AnalyticsCard
              key={`analytics-${index}`}
              item={item}
              total={totals[index] || 0}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Rows of posts downwards with their updated metrics */}
      <PostsTableComponent integration={integration} />
    </div>
  );
};
