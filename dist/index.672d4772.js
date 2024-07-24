"use strict";
class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10);
    clicks = 0;
    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription() {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 16;
    #workouts = [];
    constructor(){
        this._getposition();
        this._getLocalStorage();
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    }
    _getposition() {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert("could not get your position");
        });
    }
    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude},13z?entry=ttu`);
        const coords = [
            latitude,
            longitude
        ];
        this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
        L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            attribution: '\xa9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on("click", this._showForm.bind(this));
        this.#workouts.forEach((work)=>{
            this._renderWorkoutMarker(work);
        });
    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }
    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(()=>{
            form.style.display = "grid";
        }, 1000);
    }
    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }
    _newWorkout(e) {
        const allPositive = (...inputs)=>inputs.every((inp)=>inp > 0);
        let workout;
        e.preventDefault();
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        if (!Number.isFinite(distance) || !Number.isFinite(duration) || !allPositive(distance, duration)) return alert("Inputs have to be positive numbers!");
        const { lat, lng } = this.#mapEvent.latlng;
        const coords = [
            lat,
            lng
        ];
        if (type === "running") {
            const cadence = +inputCadence.value;
            if (!Number.isFinite(cadence) || !allPositive(cadence)) return alert("Inputs have to be positive numbers!");
            workout = new Running(coords, distance, duration, cadence);
        }
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            if (!Number.isFinite(elevation)) return alert("Inputs have to be positive numbers!");
            workout = new Cycling(coords, distance, duration, elevation);
        }
        this.#workouts.push(workout);
        this._renderWorkoutMarker(workout);
        this._renderWorkout(workout);
        this._hideForm();
        this._setLocalStorage();
    }
    _renderWorkoutMarker(workout) {
        const [lat, lng] = workout.coords;
        L.marker([
            lat,
            lng
        ]).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type === "running" ? "\uD83C\uDFC3\u200D\u2642\uFE0F" : "\uD83D\uDEB4\u200D\u2640\uFE0F"} ${workout.description} `).openPopup();
    }
    _renderWorkout(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "\uD83C\uDFC3\u200D\u2642\uFE0F" : "\uD83D\uDEB4\u200D\u2640\uFE0F"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">\u{23F1}</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
            `;
        if (workout.type === "running") html += `
            <div class="workout__details">
            <span class="workout__icon">\u{26A1}\u{FE0F}</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">\u{1F9B6}\u{1F3FC}</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
        if (workout.type === "cycling") html += `
            <div class="workout__details">
            <span class="workout__icon">\u{26A1}\u{FE0F}</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">\u{26F0}</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
        html += `</li>`;
        containerWorkouts.insertAdjacentHTML("beforeend", html);
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest(".workout");
        console.log(workoutEl);
        if (!workoutEl) return;
        const workout = this.#workouts.find((work)=>work.id === workoutEl.dataset.id);
        console.log(workout);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
        workout.click();
    }
    _setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));
        console.log(data);
        if (!data) return;
        this.#workouts = data.map((work)=>{
            if (work.type === "running") return new Running(work.coords, work.distance, work.duration, work.cadence);
            else if (work.type === "cycling") return new Cycling(work.coords, work.distance, work.duration, work.elevationGain);
        });
        // Ensure the map is loaded before rendering the workouts
        if (this.#map) this.#workouts.forEach((work)=>{
            this._renderWorkout(work);
            this._renderWorkoutMarker(work);
        });
    }
    reset() {
        localStorage.removeItem("workout");
        localStorage.reload();
    }
}
const app = new App();

//# sourceMappingURL=index.672d4772.js.map
