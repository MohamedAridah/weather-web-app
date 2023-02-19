let prevSearchResults = localStorage.getItem("recentLocations")
  ? JSON.parse(localStorage.getItem("recentLocations"))
  : [];

// Page Elemets
const mainContainer = document.querySelector(".main-container");
const popUpElements = document.querySelectorAll("[data-close-popup]");

// Fetching Functionality
const key = "4e77ee1eb00f41a9cf3d01d583a2d145";

const buildWeatherUI = (cityInfo) => {
  fetchData(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${cityInfo.lat}&lon=${cityInfo.lon}&appid=${key}&units=metric`
  )
    .then((data) => {
      console.log("OneCall API Done...");
      let dt = dateTimeFormator(data.current.dt);
      // mainContainer.innerHTML = "";
      mainContainer.innerHTML = `
            ${locationAndDate(cityInfo, dt)}
            <div class='current'>
              ${currentTemp(data.current, data.current.weather[0])}
              ${currentStats(data.current)}
            </div>
            ${weatherByHour(data.hourly)}
            ${next5Days(data.daily)}
          `;

      // Save to localstorage
      recentToLocalstorage({
        icon: `http://openweathermap.org/img/wn/${data.current.weather[0].icon}@4x.png`,
        iconDescription: data.current.weather[0].description,
        cityName: cityInfo.name,
        country: cityInfo.country,
        min: Math.round(data.daily[0].temp.min),
        max: Math.round(data.daily[0].temp.max),
      });
    })
    .catch((err) => {
      console.warn("OneCall API fetchData rejected ", err.message);
    });
};

// Fetching function
const fetchData = async (resource) => {
  loader("show");
  console.log("Fetching Data Starting...");
  try {
    const res = await fetch(resource);
    if (!res.ok) {
      let error = await res.json();
      notification("show", "Failed to get data", error.message);
      throw new Error(
        `Error code ${error.cod} & Error message ${error.message}`
      );
    } else {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("Fetching Error: " + err);
    notification("show", "Failed to get data", err.message);
  } finally {
    console.log("Fetching Data Finished");
    loader("hide");
  }
};

// Get City coords [Search By city coords]
const searchByCoords = async (lat, lon) => {
  let url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${key}`;
  // This fetch will return city [city]s coords response
  try {
    let cityCoords = await fetchData(url);
    // Extract these keys from the response
    let { lat, lon, name, country, state } = cityCoords[0];
    let data = { lat, lon, name, country, state };

    // Output forecast
    buildWeatherUI(data);
  } catch (err) {
    console.warn("searchByCoords Failed " + err);
  }
};

// Get City coords [Search By city name]
const searchByName = async (cityName) => {
  let url = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${key}`;
  // This fetch will return city [city]s coords response
  try {
    let cityCoords = await fetchData(url);
    // Extract these keys from the response
    let { lat, lon, name, country, state } = cityCoords[0];
    let data = { lat, lon, name, country, state };

    // Output forecast
    buildWeatherUI(data);
  } catch (err) {
    console.warn("searchByName Failed " + err);
  }
};

const notification = (visibility = "hide", title, text, isDanger = true) => {
  const notifiTime = 7000;
  let notifiBody = document.querySelector(".notification");
  let notifiTitle = notifiBody.querySelector(".notification__title");
  let notifiText = notifiBody.querySelector(".notification__text");

  visibility == "hide"
    ? notifiBody.classList.remove("show")
    : notifiBody.classList.add("show");
  isDanger
    ? notifiBody.classList.add("danger")
    : notifiBody.classList.remove("danger");

  notifiTitle.innerText = title;
  notifiText.innerText = text;

  setTimeout(() => {
    notifiBody.classList.remove("show");
    setTimeout(() => {
      notifiBody.classList.remove("danger");
    }, 8000 - notifiTime);
  }, notifiTime);
};

// Page Components
const locationAndDate = (location, date) => {
  const locationStatus = localStorage.getItem("locationStatus");
  const locationIcon =
    locationStatus == "allowed"
      ? { icon: "locationAllowed.svg", alt: "location access allowed" }
      : { icon: "locationPaned.svg", alt: "location access refused" };
  return `
    <header class="header">
        <div class="location-and-date">
          <h1 class="location-and-date__location">
          ${location.name}, ${location.country}
            <img src="./icons/${locationIcon.icon}" alt="" title="${
    locationIcon.alt
  }" onclick="searchByCurrentPosition()"/>
          </h1>
          <div class="location-and-date__date">
            ${date.weekday.full} ${dateSuffix(date.date)} ${date.month.full}
            <span class='location-and-date__time' onclick="searchByName('${
              location.name
            }, ${location.country}')">${date.shortHour}:${
    date.minute
  }${date.hour12.toLowerCase()} &#8635;
            </span>
          </div>
        </div>
        <div class='app-temp-unit'>
          <span>&deg;C</span>
          <div class='switch-wrapper' onclick="switcherHandeler()">
            <input type='checkbox' class='switch-input' />
            <span class='switch-button'></span>
          </div>
          <span>&deg;F</span>
        </div>
        <div class="serach-box">
          <form class="search-location" onsubmit="searchLocationForecast()">
            <div class="form-control">
              <img src="./icons/searchIcon.svg" alt="" class="search-icon" />
              <input type="text" placeholder="Search for a city..." onclick="recentSearchLocations()" />
            </div>
          </form>
          <!-- Suggestions -->
          <div class="prev-search">
              ${prevSearchResults.length > 0 ? `<p>recent search</p>` : ""}
              <div>
              ${
                prevSearchResults.length != 0
                  ? prevSearchResults
                      .map(
                        ({
                          icon,
                          iconDescription,
                          cityName,
                          country,
                          min,
                          max,
                        }) => {
                          return `
                    <div class="prev-search_location" data-location="${cityName},${country}">
                      <img
                        src="${icon}"
                        alt="${iconDescription}"
                        title="${iconDescription}"
                      />
                      <div>${cityName}, ${country}</div>
                      <div>${min}&deg; | ${max}&deg;</div>
                      <!-- <div>&#10006;</div> -->
                      <div>&#x2715</div>
                    </div>
                    `;
                        }
                      )
                      .join(" ")
                  : ""
              }
              </div>
          </div>
        </div>
    </header>
`;
};

const currentTemp = ({ temp }, { main, icon, description }) => {
  return `
  <div class="current-temperature">
    <div class="current-temperature__icon-container">
      <img
        src="http://openweathermap.org/img/wn/${icon}@4x.png"
        class="current-temperature__icon"
        alt="${description}"
        title="${description}"
      />
    </div>
    <div class="current-temperature__content-container">
      <div class="current-temperature__value" data-celsius="true">
        <span>${Math.round(temp)}</span>
        <span class='temp-unit'>&deg;C</span>
      </div>
      <div class="current-temperature__summary" style="text-transform:capitalize;">${main}, ${description}</div>
    </div>
  </div>`;
};

const currentStats = ({
  feels_like,
  sunrise,
  sunset,
  humidity,
  visibility,
  wind_speed,
}) => {
  sunrise = dateTimeFormator(sunrise);
  sunset = dateTimeFormator(sunset);
  feels_like = Math.round(feels_like);
  visibility /= 1000;
  return `
    <div class="current-stats">
      <div>
        <div class="current-stats__value high-value" data-celsius="true">
          <span>${feels_like}</span>
          <span class='temp-unit'>&deg;C</span>
        </div>
        <div class="current-stats__label">Feels Like</div>
        <div class="current-stats__value low-value">${visibility} km</div>
        <div class="current-stats__label">Visibility</div>
      </div>
      <div>
        <div class="current-stats__value wind-value">${wind_speed}m/s</div>
        <div class="current-stats__label">Wind</div>
        <div class="current-stats__value rain-value">${humidity}%</div>
        <div class="current-stats__label">Humidity</div>
      </div>
      <div>
        <div class="current-stats__value sunrise-value">${sunrise.hour24}:${sunrise.minute}</div>
        <div class="current-stats__label">Sunrise</div>
        <div class="current-stats__value sunset-value">${sunset.hour24}:${sunset.minute}</div>
        <div class="current-stats__label">Sunset</div>
      </div>
    </div>
  `;
};

const weatherByHour = (hourly) => {
  let limit = 7;
  let data = [];
  for (let i = 0; i <= hourly.length; i += 3) {
    if (data.length >= limit) {
      break;
    }
    data.push(hourly[i]);
  }
  return `
    <div class="weather-by-hour">
      <h2 class="weather-by-hour__heading">Today's weather</h2>
      <div class="weather-by-hour__container">
        ${data
          .map(({ dt, temp, weather }) => {
            dt = dateTimeFormator(dt);
            return `
              <div class="weather-by-hour__item">
                <div class="weather-by-hour__hour">${dt.shortHour} ${
              dt.hour12
            }</div>
                <img src="http://openweathermap.org/img/wn/${
                  weather[0].icon
                }@4x.png" alt="${weather[0].description}" title="${
              weather[0].description
            }"  />
                <div data-celsius="true">
                  <span>${Math.round(temp)}</span>
                  <span class='temp-unit'>&deg;C</span>
                </div>
              </div>`;
          })
          .join(" ")}
      </div>
    </div>
  `;
};

const next5Days = (daily) => {
  return `
    <div class="next-5-days">
      <h2 class="next-5-days__heading">Next 5 days</h2>
      <div class="next-5-days__container">
          ${daily
            .map(({ dt, temp: { min, max }, weather, pop, wind_speed }) => {
              dt = dateTimeFormator(dt);
              pop = (pop * 100).toFixed();
              min = Math.round(min);
              max = Math.round(max);
              return `
              <div class="next-5-days__row">
                <div class="next-5-days__date">
                  ${dt.weekday.full}
                  <div class="next-5-days__label">
                    ${dt.date}/${dt.month.index + 1}
                  </div>
                </div>
          
                <div class="next-5-days__low">
                   <div class="next-5-days__value" data-celsius="true">
                   <span>${min}</span>
                    <span class='temp-unit'>&deg;C</span>
                   </div> 
                  <div class="next-5-days__label">Low</div>
                </div>
          
                <div class="next-5-days__high">
                  <div class="next-5-days__value" data-celsius="true">
                    <span>${max}</span>
                    <span class='temp-unit'>&deg;C</span>
                  </div>
                  <div class="next-5-days__label">High</div>
                </div>
          
                <div class="next-5-days__icon">
                  <img src="http://openweathermap.org/img/wn/${
                    weather[0].icon
                  }@4x.png" alt="${weather[0].description}" title="${
                weather[0].description
              }"/>
                </div>
          
                <div class="next-5-days__rain">
                  ${pop}%
                  <div class="next-5-days__label">Rain</div>
                </div>
          
                <div class="next-5-days__wind">
                  ${wind_speed}m/s
                  <div class="next-5-days__label">Wind</div>
                </div>
              </div>`;
            })
            .join(" ")}
      </div>
    </div>`;
};

// Helper Functions
const zeroLead = (num) => {
  if (num < 10) return num.toString().padStart(2, 0);
  else return num;
};

const dateSuffix = (num) => {
  let result = "";
  let numToString = num.toString();
  let lastLetter = numToString[numToString.length - 1];

  // & num != 11 ==> to make sure [st] suffix for all numbers ends with 1 EXCEPT 11
  if (lastLetter == 1 && num != 11) {
    result += num + "st";
  } else if (lastLetter == 2) {
    result += num + "nd";
  } else if (lastLetter == 3) {
    result += num + "rd";
    //Return [th] suffix for all numbers that doesn't end with [1,2,3] EXCEPT 11 return [th]
  } else if (lastLetter > 3 || num == 11 || lastLetter == 0) {
    result += num + "th";
  }
  return result;
};

const dateTimeFormator = (timeInUnix) => {
  const toMillseconds = timeInUnix * 1000;
  const dateString = new Date(toMillseconds);
  const weekdays = [
    // Default is full
    { full: "Sunday", short: "Sun", index: 0 },
    { full: "Monday", short: "Mon", index: 1 },
    { full: "Tuesday", short: "Tue", index: 2 },
    { full: "Wednesday", short: "Wed", index: 3 },
    { full: "Thursday", short: "Thu", index: 4 },
    { full: "Friday", short: "Fri", index: 5 },
    { full: "Saturday", short: "Sat", index: 6 },
  ];
  const months = [
    // Default is full
    { full: "January", short: "Jan", index: 0 },
    { full: "February", short: "Feb", index: 1 },
    { full: "March", short: "Mar", index: 2 },
    { full: "April", short: "Apr", index: 3 },
    { full: "May", short: "May", index: 4 },
    { full: "June", short: "Jun", index: 5 },
    { full: "July", short: "Jul", index: 6 },
    { full: "August", short: "Aug", index: 7 },
    { full: "September", short: "Sep", index: 8 },
    { full: "October", short: "Oct", index: 9 },
    { full: "November", short: "Nov", index: 10 },
    { full: "December", short: "Dec", index: 11 },
  ];
  let year, month, weekday, date, hour24, shortHour, hour12, minute;
  year = dateString.getFullYear();
  month = months[dateString.getMonth()];
  weekday = weekdays[dateString.getDay()];
  date = dateString.getDate();
  hour24 = zeroLead(dateString.getHours());
  hour12 = hour24 >= 12 ? `PM` : `AM`;
  shortHour = hour24 > 12 ? zeroLead(hour24 - 12) : hour24;
  minute = zeroLead(dateString.getMinutes());
  return {
    year,
    month,
    weekday,
    date,
    hour24,
    shortHour,
    hour12,
    minute,
  };
};

// lat: 30.9782886
// lon: 31.3189714

// Show current Position Forecast
const successCallback = (position) => {
  let { latitude: lat, longitude: lon } = position.coords;

  searchByCoords(lat, lon);
  localStorage.setItem("locationStatus", "allowed");
};

const errorCallback = (error) => {
  localStorage.setItem("locationStatus", "denied");
  if (error.code === 1) {
    notification(
      "show",
      error.message,
      "Please allow access to your location to get your location weather forecast"
    );
    // As default If user denied geolocation access
    searchByName("london");
  } else if (error.code === 2) {
    notification(
      "show",
      error.message,
      "Cannot get your location <br> please reload the page"
    );
  } else if (error.code === 3) {
    notification(
      "show",
      error.message,
      "	Geolocation information was not obtained in the allowed time."
    );
  }
};

const options = {
  enableHighAccuracy: true,
  timeout: 5000, // take 10s to get location
  maximumAge: 3600000, // cash data for one hour only
};

const searchByCurrentPosition = () => {
  navigator.geolocation.getCurrentPosition(
    successCallback,
    errorCallback,
    options
  );
};
searchByCurrentPosition();

// Search Form Function
const searchLocationForecast = () => {
  event.preventDefault();
  let searchValue = event.target
    .querySelector(".search-location input")
    .value.trim();
  if (searchValue == "" || searchValue == null)
    notification(
      "show",
      "Empty value",
      "Cannot search for empty value. Please write city name first then search"
    );
  else searchByName(searchValue);
  event.target.reset();
};

// Loader
const loader = (visibility = "hide") => {
  const body = document.querySelector("body");

  visibility == "hide"
    ? body.classList.remove("loading")
    : body.classList.add("loading");
};

// Show Recent Search Loactions
const recentSearchLocations = () => {
  const prevSearchWrapper = document.querySelector(".prev-search");
  const prevSearchWrapperHeight = prevSearchWrapper.scrollHeight;
  const input = document.querySelector(".search-location input");

  prevSearchWrapper.style.height = prevSearchWrapperHeight + "px";

  document.addEventListener("click", (e) => {
    if (e.target != input) {
      prevSearchWrapper.style.height = "0px";
    } else {
      return false;
    }
  });

  const prevLocations = prevSearchWrapper.querySelectorAll(
    ".prev-search_location"
  );

  prevLocations.forEach((location) => {
    location.addEventListener("click", (e) => {
      if (e.currentTarget.querySelector("div:last-of-type") == e.target) {
        const locationIndex = prevSearchResults.findIndex((location) => {
          return e.currentTarget.dataset.location == location.cityName;
        });
        e.currentTarget.remove();
        prevSearchResults.splice(locationIndex, 1);
        localStorage.setItem(
          "recentLocations",
          JSON.stringify(prevSearchResults)
        );
      } else {
        console.log("clicked");
        const cityName = location.dataset.location;
        searchByName(cityName);
      }
    });
  });
};

// SaveRecent Search Location to Localstorage
const recentToLocalstorage = (locationInfo) => {
  prevSearchResults.unshift(locationInfo);
  removeDublicates(prevSearchResults);
  prevSearchResults = removeDublicates(prevSearchResults);

  // Save Last 5 Seraches Only
  if (prevSearchResults.length > 6) {
    prevSearchResults.pop();
  }
  localStorage.setItem("recentLocations", JSON.stringify(prevSearchResults));
};

// Remove Same Search Locations
const removeDublicates = (arr) => {
  const uniqueArray = arr.filter((item, index) => {
    const _item = JSON.stringify(item);
    return (
      index ===
      arr.findIndex((obj) => {
        return JSON.stringify(obj) === _item;
      })
    );
  });
  return uniqueArray;
};

// Close Popups like [notification and etc...]
const closePopups = (e, closeBtn = "close-popup-btn") => {
  return new Promise((resolve, reject) => {
    e.currentTarget.querySelector(`.${closeBtn}`) == e.target
      ? resolve("success")
      : reject("error happend");
  });
};

popUpElements.forEach((element) => {
  element.addEventListener("click", (e) => {
    closePopups(e)
      .then((d) => {
        console.log(d);

        // Hide that Elemetn
        element.classList.remove("show");
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

const celsiusToFahrenheit = (num) => {
  const temp = Math.round(num * 1.8 + 32);
  const symbol = "&deg;F";
  return { temp, symbol };
};

const fahrenheitToCelsius = (num) => {
  const temp = Math.round((num - 32) / 1.8);
  const symbol = "&deg;C";
  return { temp, symbol };
};

const changeAppTempUnit = (convertTo) => {
  let tempElemets = document.querySelectorAll("[data-celsius='true']");
  tempElemets.forEach((element) => {
    const value = element.querySelector("span:first-of-type");
    const unit = element.querySelector("span:last-of-type");
    if (convertTo == "celsius") {
      const toCelsuis = fahrenheitToCelsius(+value.textContent.trim());
      value.textContent = toCelsuis.temp;
      unit.innerHTML = toCelsuis.symbol;
    }

    if (convertTo == "fahrenheit") {
      const toFahrenheit = celsiusToFahrenheit(+value.textContent.trim());
      value.textContent = toFahrenheit.temp;
      unit.innerHTML = toFahrenheit.symbol;
    }
  });
};

const switcherHandeler = () => {
  event.currentTarget.querySelector(".switch-input").checked
    ? changeAppTempUnit("fahrenheit")
    : changeAppTempUnit("celsius");
};
