import React, { useCallback, useEffect, useState } from 'react'

const FALLBACK_LOCATION = { name: 'Buner, Pakistan',
latitude: 34.3943,
longitude: 72.6151}

const weatherLabels = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail'
}

function getWeatherIcon(code) {
  if (code === 0) return 'sun'
  if ([1, 2].includes(code)) return 'cloud-sun'
  if ([3, 45, 48].includes(code)) return 'cloud'
  if (code >= 51 && code <= 82) return 'rain'
  return 'storm'
}

function formatDay(date) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`))
}

async function fetchWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '5'
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error('Weather service is unavailable right now.')
  return response.json()
}

async function getAreaName(latitude, longitude) {
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
    if (!response.ok) return ''
    const data = await response.json()
    return [data.locality, data.principalSubdivision, data.countryName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', ')
  } catch (error) {
    return ''
  }
}

async function searchLocations(query) {
  const params = new URLSearchParams({ name: query, count: '10', language: 'en', format: 'json', countryCode: 'PK' })
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!response.ok) throw new Error('Location search is unavailable right now.')
  const data = await response.json()
  return (data.results || []).filter((result) => result.country_code === 'PK')
}

export default function Weather() {
  const [location, setLocation] = useState(FALLBACK_LOCATION)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationNotice, setLocationNotice] = useState('Showing weather for Lahore. Use your location for local conditions.')
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)

  const loadWeather = useCallback(async (nextLocation) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchWeather(nextLocation)
      setWeather(data)
      setLocation(nextLocation)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWeather(FALLBACK_LOCATION)
  }, [loadWeather])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationNotice('Location is not supported by this browser.')
      return
    }
    setLocationNotice('Requesting your location...')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        getAreaName(coords.latitude, coords.longitude).then((areaName) => {
          const nextLocation = { name: areaName || 'Your current area', latitude: coords.latitude, longitude: coords.longitude }
          setLocationNotice('Live conditions for your current location.')
          loadWeather(nextLocation)
        })
      },
      () => setLocationNotice('Location permission was unavailable. Showing Lahore weather instead.')
    )
  }

  async function searchWeather(event) {
    event.preventDefault()
    if (!searchTerm.trim()) return
    setSearching(true)
    setError('')
    try {
      const results = await searchLocations(searchTerm.trim())
      if (!results.length) throw new Error('Pakistan mein yeh area nahi mila. District ya city ka naam dobara check karein.')
      const result = results[0]
      const nextLocation = {
        name: [result.name, result.admin1, result.country].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', '),
        latitude: result.latitude,
        longitude: result.longitude
      }
      setLocationNotice('Showing live conditions for the searched area.')
      await loadWeather(nextLocation)
    } catch (searchError) {
      setError(searchError.message)
    } finally {
      setSearching(false)
    }
  }

  const current = weather?.current
  const daily = weather?.daily

  return (
    <section className="weather-page">
      <div className="weather-heading">
        <div>
          <p className="section-kicker">Live farm conditions</p>
          <h1>Weather today</h1>
          <p>Plan irrigation, spraying, and field work with current local conditions.</p>
        </div>
        <button type="button" className="location-btn" onClick={useMyLocation}>Use my location</button>
      </div>

      <form className="weather-search" onSubmit={searchWeather}>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search city or area, e.g. Buner"
          aria-label="Search weather by city or area"
        />
        <button type="submit" disabled={searching}>{searching ? 'Searching...' : 'Search'}</button>
      </form>

      <div className="weather-location">
        <span className="location-pin" aria-hidden="true">+</span>
        <div>
          <strong>{location.name}</strong>
          <p>{locationNotice}</p>
        </div>
      </div>

      {loading && <div className="weather-status">Loading live weather...</div>}
      {error && <div className="weather-status weather-error">{error} <button type="button" onClick={() => loadWeather(location)}>Try again</button></div>}

      {current && daily && (
        <>
          <div className="current-weather">
            <div className={`weather-icon ${getWeatherIcon(current.weather_code)}`} aria-hidden="true" />
            <div>
              <p className="weather-condition">{weatherLabels[current.weather_code] || 'Changing conditions'}</p>
              <strong className="current-temperature">{Math.round(current.temperature_2m)}&deg;</strong>
              <p>Feels like {Math.round(current.apparent_temperature)}&deg;C</p>
            </div>
            <div className="weather-metrics">
              <span><b>{current.relative_humidity_2m}%</b> Humidity</span>
              <span><b>{Math.round(current.wind_speed_10m)} km/h</b> Wind</span>
            </div>
          </div>

          <h2 className="forecast-title">5-day forecast</h2>
          <div className="forecast-grid">
            {daily.time.map((date, index) => (
              <article className="forecast-card" key={date}>
                <strong>{formatDay(date)}</strong>
                <div className={`small-weather-icon ${getWeatherIcon(daily.weather_code[index])}`} aria-hidden="true" />
                <span>{weatherLabels[daily.weather_code[index]] || 'Mixed conditions'}</span>
                <b>{Math.round(daily.temperature_2m_max[index])}&deg; <em>{Math.round(daily.temperature_2m_min[index])}&deg;</em></b>
                <small>{daily.precipitation_probability_max[index] || 0}% rain chance</small>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}