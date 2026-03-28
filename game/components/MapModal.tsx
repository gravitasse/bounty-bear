'use client'

import { useEffect, useRef } from 'react'

type Bounty = {
  id: string
  location_name: string
  reward_points: number
  difficulty: number
  created_at: string
  expires_at: string
  status?: string
  creator_id: string
  clues: { text: string; unlock_distance: number | null }[]
  verification_data: { passcode_hash: string; hint: string; lat?: number; lng?: number }
}

export default function MapModal({
  bounties,
  onClose,
  onSelect,
}: {
  bounties: Bounty[]
  onClose: () => void
  onSelect: (b: Bounty) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default marker icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const mappableBounties = bounties.filter(
        b => b.verification_data?.lat != null && b.verification_data?.lng != null
      )

      // Default center: first bounty or world view
      const center: [number, number] = mappableBounties.length > 0
        ? [mappableBounties[0].verification_data.lat!, mappableBounties[0].verification_data.lng!]
        : [20, 0]

      const zoom = mappableBounties.length > 0 ? 13 : 2

      const map = L.map(mapRef.current!, { center, zoom })
      leafletRef.current = map

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Custom bear icon
      const bearIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;
          background:var(--terminal-bg,#0d1117);
          border:2px solid #00ff41;
          border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
          box-shadow:0 0 10px rgba(0,255,65,0.4);
        ">🐻</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      // Add markers
      mappableBounties.forEach(b => {
        const lat = b.verification_data.lat!
        const lng = b.verification_data.lng!
        const stars = '★'.repeat(b.difficulty) + '☆'.repeat(5 - b.difficulty)
        const marker = L.marker([lat, lng], { icon: bearIcon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family:VT323,monospace;background:#0d1117;color:#00ff41;padding:8px;min-width:160px;border:1px solid #00ff41;">
            <div style="font-weight:bold;font-size:1.1rem;">${b.location_name.toUpperCase()}</div>
            <div style="color:#ffb000;">${b.reward_points.toLocaleString()} PTS &nbsp; ${stars}</div>
            <button
              onclick="window.__selectBounty('${b.id}')"
              style="margin-top:8px;width:100%;background:#00ff41;color:#0a0a0a;border:none;padding:4px 8px;cursor:pointer;font-family:VT323,monospace;font-size:1rem;font-weight:bold;"
            >► HUNT THIS</button>
          </div>
        `, { className: 'bear-popup' })
      })

      // Global callback for popup buttons
      ;(window as any).__selectBounty = (id: string) => {
        const b = bounties.find(x => x.id === id)
        if (b) { onSelect(b); onClose() }
      }

      // Show user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;background:#ffb000;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(255,176,0,0.8);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          })
          L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('<div style="font-family:VT323,monospace;color:#ffb000;">YOU ARE HERE</div>', { className: 'bear-popup' })
        })
      }
    })

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    return () => {
      leafletRef.current?.remove()
      leafletRef.current = null
      delete (window as any).__selectBounty
    }
  }, [])

  const mappable = bounties.filter(b => b.verification_data?.lat != null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px', borderBottom: '2px solid var(--green)',
        background: 'var(--terminal-bg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-press-start),"Press Start 2P",cursive', fontSize: '0.65rem', color: 'var(--amber)' }}>
          🗺️ BOUNTY MAP
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '1.1rem', color: 'var(--border)' }}>
            {mappable.length} / {bounties.length} MAPPED
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {mappable.length === 0 && bounties.length > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'var(--terminal-bg)', border: '1px solid var(--border)',
          padding: 24, textAlign: 'center', fontSize: '1.2rem', color: 'var(--amber)',
          pointerEvents: 'none',
        }}>
          MAP DATA UNAVAILABLE<br />
          <span style={{ color: 'var(--border)', fontSize: '1rem' }}>Bounties posted before map update have no coordinates.</span>
        </div>
      )}
    </div>
  )
}
