import React, { useMemo } from 'react';
import type { Videos as VideosType, VideoItem } from '../types';
import EditableText from './EditableText';

type Props = {
  videos: VideosType | undefined;
  isPreview?: boolean;
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
};

type VideoPlayerProps = {
  video: VideoItem;
  index: number;
  editable?: boolean;
};

function extractIframeSrc(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.startsWith('<')) {
    const match = trimmed.match(/src\s*=\s*"([^"]+)"/i) || trimmed.match(/src\s*=\s*'([^']+)'/i);
    return match ? match[1] : '';
  }
  return trimmed;
}

function toYouTubeEmbed(urlOrId: string, opts: { autoplay?: boolean; controls?: boolean; loop?: boolean; muted?: boolean }): string {
  // Accept full URL or video ID
  let id = urlOrId;
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || id;
    if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/').pop() || id;
  } catch {}
  const params = new URLSearchParams();
  if (opts.autoplay) params.set('autoplay', '1');
  if (opts.controls === false) params.set('controls', '0');
  if (opts.muted) params.set('mute', '1');
  if (opts.loop) {
    params.set('loop', '1');
    params.set('playlist', id);
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function toVimeoEmbed(urlOrId: string, opts: { autoplay?: boolean; controls?: boolean; loop?: boolean; muted?: boolean }): string {
  let id = urlOrId;
  let hash = '';
  
  try {
    const u = new URL(urlOrId);
    const path = u.pathname.replace(/\/+$/, '');
    // Extract video ID from path like /video/1118851183
    const pathParts = path.split('/');
    id = pathParts[pathParts.length - 1] || id;
    // Extract hash parameter if present (e.g., ?h=f169590806)
    hash = u.searchParams.get('h') || '';
  } catch {
    // If URL parsing fails, try to extract ID from string
    const match = urlOrId.match(/\/video\/(\d+)/);
    if (match) {
      id = match[1];
    }
    // Try to extract hash from string
    const hashMatch = urlOrId.match(/[?&]h=([^&]+)/);
    if (hashMatch) {
      hash = hashMatch[1];
    }
  }
  
  const params = new URLSearchParams();
  
  // Add hash if present (required for private videos)
  if (hash) params.set('h', hash);
  
  // Vimeo-specific parameters - be explicit about values
  if (opts.autoplay) {
    params.set('autoplay', '1');
  }
  if (opts.loop) {
    params.set('loop', '1');
  }
  if (opts.muted) {
    params.set('muted', '1');
  }
  if (opts.controls === false) {
    params.set('controls', '0');
  }
  
  // Additional Vimeo parameters for better control
  params.set('background', (opts.autoplay && opts.muted && !opts.controls) ? '1' : '0');
  params.set('byline', '0'); // Hide video byline
  params.set('portrait', '0'); // Hide author portrait
  params.set('title', '0'); // Hide video title
  
  const finalUrl = `https://player.vimeo.com/video/${id}?${params.toString()}`;
  return finalUrl;
}

function VideoPlayer({ video, index, editable }: VideoPlayerProps) {
  const {
    provider = 'youtube',
    url = '',
    title,
    subtitle,
    autoplay = false,
    controls = true,
    loop = false,
    muted = false,
    width,
    height,
  } = video;

  const src = useMemo(() => {
    const input = extractIframeSrc(url);
    if (!input) return '';
    if (provider === 'youtube') return toYouTubeEmbed(input, { autoplay, controls, loop, muted });
    if (provider === 'vimeo') return toVimeoEmbed(input, { autoplay, controls, loop, muted });
    // Auto-detect provider if not explicitly set
    if (input.includes('vimeo.com')) {
      console.log('Auto-detected Vimeo, using Vimeo embed');
      return toVimeoEmbed(input, { autoplay, controls, loop, muted });
    } else if (input.includes('youtube.com') || input.includes('youtu.be')) {
      console.log('Auto-detected YouTube, using YouTube embed');
      return toYouTubeEmbed(input, { autoplay, controls, loop, muted });
    } else {
      // Fallback to YouTube if provider is not recognized
      console.warn('Unknown video provider, defaulting to YouTube embed');
      return toYouTubeEmbed(input, { autoplay, controls, loop, muted });
    }
  }, [provider, url, autoplay, controls, loop, muted]);

  // If no src, show placeholder in edit mode, otherwise return null
  if (!src) {
    if (!editable) return null;
    
    // Show placeholder in edit mode
    return (
      <div className="mb-8 last:mb-0">
        <div className="mt-4">
          <div className="relative w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center" style={{ paddingTop: '56.25%' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 font-medium mb-1">No video URL provided</p>
              <p className="text-sm text-gray-500">Add a YouTube or Vimeo URL in the editor to display a video</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Responsive container if no explicit width/height
  const hasFixedSize = typeof width === 'number' && width > 0 && typeof height === 'number' && height > 0;

  return (
    <div className="mb-8 last:mb-0">
      <div className="mt-4">
        {hasFixedSize ? (
          <div style={{ width, height }} className="mx-auto">
            <iframe
              width={width}
              height={height}
              src={src}
              title={title || `Video ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 0, display: 'block' }}
            />
          </div>
        ) : (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={src}
              title={title || `Video ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 0 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Videos({ videos, isPreview, backgroundClass = 'bg-white', editable, onEdit }: Props) {
  if (!videos || !videos.items || videos.items.length === 0) return null;

  // Filter out videos without URLs (unless in editable mode, where we show placeholders)
  const validVideos = editable 
    ? videos.items 
    : videos.items.filter(video => video.url && video.url.trim());
  
  if (validVideos.length === 0) return null;

  return (
    <section id="videos" className={`py-12 ${backgroundClass}`}>
      <div className="max-w-5xl mx-auto px-4">
        {(videos.title || videos.subtitle || editable) && (
          <div className="text-center mobile-left mb-12">
            {(videos.title || editable) && (
              <EditableText
                as="h2"
                className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 pb-3 border-b border-gray-200 inline-block"
                value={videos.title || ''}
                path="videos.title"
                editable={!!editable}
                onEdit={onEdit}
                placeholder="Videos"
                textSize={videos.titleTextSize || 2.25}
                onTextSizeChange={onEdit ? (size: number) => onEdit('videos.titleTextSize', size.toString()) : undefined}
                textSizeLabel="Videos Title Size"
                textSizePresets={[1.875, 2.25, 2.75, 3.25]}
              />
            )}
            {(videos.subtitle || editable) && (
              <EditableText
                as="p"
                className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
                value={videos.subtitle || ''}
                path="videos.subtitle"
                editable={!!editable}
                onEdit={onEdit}
                placeholder="See our work in action"
                textSize={videos.subtitleTextSize || 1.125}
                onTextSizeChange={onEdit ? (size: number) => onEdit('videos.subtitleTextSize', size.toString()) : undefined}
                textSizeLabel="Videos Subtitle Size"
                textSizePresets={[1.0, 1.125, 1.25, 1.5]}
              />
            )}
          </div>
        )}
        <div className="space-y-12">
          {validVideos.map((video, index) => (
            <div key={index}>
              {(video.title || video.subtitle || editable) && (
                <div className="text-center mobile-left mb-6">
                  {(video.title || editable) && (
                    <EditableText
                      as="h3"
                      className="text-xl font-bold tracking-tight text-gray-900 mb-2"
                      value={video.title || ''}
                      path={`videos.items.${index}.title`}
                      editable={!!editable}
                      onEdit={onEdit}
                      placeholder="Video title"
                      textSize={video.titleTextSize || 1.25}
                      onTextSizeChange={onEdit ? (size: number) => onEdit(`videos.items.${index}.titleTextSize`, size.toString()) : undefined}
                      textSizeLabel="Video Title Size"
                      textSizePresets={[1.0, 1.125, 1.25, 1.5]}
                    />
                  )}
                  {(video.subtitle || editable) && (
                    <EditableText
                      as="p"
                      className="text-lg text-gray-600 max-w-2xl mx-auto"
                      value={video.subtitle || ''}
                      path={`videos.items.${index}.subtitle`}
                      editable={!!editable}
                      onEdit={onEdit}
                      placeholder="Video subtitle"
                      textSize={video.subtitleTextSize || 1.0}
                      onTextSizeChange={onEdit ? (size: number) => onEdit(`videos.items.${index}.subtitleTextSize`, size.toString()) : undefined}
                      textSizeLabel="Video Subtitle Size"
                      textSizePresets={[0.875, 1.0, 1.125, 1.25]}
                    />
                  )}
                </div>
              )}
              <VideoPlayer video={video} index={index} editable={editable} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
