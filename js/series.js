const API_KEY = 'a5b213a231ca671a9dd83f1bacd9d982';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// elementos DOM
const elements = {
    trendingCarousel: document.getElementById('trendingSeriesCarousel'),
    popularSeries: document.getElementById('popularSeries'),
    genresList: document.getElementById('seriesGenresList'),
    seriesModal: document.getElementById('seriesModal'),
    searchInput: document.querySelector('.search-bar input'),
    themeToggle: document.querySelector('.theme-toggle'),
    featuredSeries: document.getElementById('featuredSeries')
};

// Estado 
const state = {
    currentTheme: 'light',
    series: [],
    genres: []
};

// solicitudes a la API 
const fetchData = async (endpoint) => {
    try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}&language=es-ES`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};

const getImageUrl = (path, size = 'w500') => {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : 'placeholder-image.jpg';
};

// Cargar series en tendencia
const loadTrending = async () => {
    const data = await fetchData('/trending/tv/week');
    if (!data) return;

    elements.trendingCarousel.innerHTML = `
        <div class="trending-carousel-container">
            <div class="trending-carousel-wrapper">
                ${data.results.slice(0, 20).map(series => `
                    <div class="carousel-item" data-series-id="${series.id}">
                        <img src="${getImageUrl(series.poster_path)}" 
                             alt="${series.name}"
                             loading="lazy">
                        <div class="carousel-item__info">
                            <h3>${series.name}</h3>
                            <span class="rating">
                                <i class="fas fa-star"></i>
                                ${series.vote_average.toFixed(1)}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="trending-controls">
                <button class="trending-control prev" aria-label="Anterior serie en tendencia">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="trending-control next" aria-label="Siguiente serie en tendencia">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="trending-indicators">
                ${data.results.slice(0, 10).map((_, index) => `
                    <button class="trending-dot ${index === 0 ? 'active' : ''}" 
                            data-slide="${index}" 
                            aria-label="Ir a la serie en tendencia ${index + 1}">
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Obtener los elementos
    const carouselWrapper = elements.trendingCarousel.querySelector('.trending-carousel-wrapper');
    const items = elements.trendingCarousel.querySelectorAll('.carousel-item');
    const dots = elements.trendingCarousel.querySelectorAll('.trending-dot');
    const prevButton = elements.trendingCarousel.querySelector('.trending-control.prev');
    const nextButton = elements.trendingCarousel.querySelector('.trending-control.next');
    let currentIndex = 0;
    const itemsToShow = 5; 
    const totalItems = items.length;

    const showSlide = (index) => {
        
        currentIndex = Math.max(0, Math.min(index, totalItems - itemsToShow));
        
        // Calcular el desplazamiento
        const offset = -(currentIndex * (100 / itemsToShow));
        carouselWrapper.style.transform = `translateX(${offset}%)`;
        
        // Actualiza los dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        // Actualiza el estado de los botones
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= totalItems - itemsToShow;
    };

    // Event listeners para los dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });

    // Event listeners para los botones de navegación
    prevButton.addEventListener('click', () => {
        showSlide(currentIndex - 1);
    });

    nextButton.addEventListener('click', () => {
        showSlide(currentIndex + 1);
    });

    // Inicia el carrusel
    showSlide(0);
};

// Cargar series destacadas en el hero
const loadHeroSeries = async () => {
    const data = await fetchData('/tv/popular');
    if (!data) return;

    const heroSeries = data.results.slice(0, 5);

    elements.featuredSeries.innerHTML = `
        <div class="hero-carousel">
            ${heroSeries.map((series, index) => `
                <div class="hero-slide ${index === 0 ? 'active' : ''}" 
                     data-series-id="${series.id}" 
                     style="z-index: ${index === 0 ? 1 : 0}">
                    <img src="${getImageUrl(series.backdrop_path, 'original')}" 
                         alt="${series.name}"
                         loading="${index === 0 ? 'eager' : 'lazy'}">
                    <div class="hero-overlay"></div>
                    <div class="hero__content">
                        <h2>${series.name}</h2>
                        <p>${series.overview}</p>
                        <button class="hero-movie__button" aria-label="Ver detalles de ${series.name}">
                            Ver más
                        </button>
                    </div>
                </div>
            `).join('')}
            
            <div class="hero-controls">
                <button class="hero-control prev" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="hero-control next" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="hero-indicators">
                ${heroSeries.map((_, index) => `
                    <button class="hero-dot ${index === 0 ? 'active' : ''}" 
                            data-slide="${index}" 
                            aria-label="Ir a la serie ${index + 1}"></button>
                `).join('')}
            </div>
        </div>
    `;
    const carouselContainer = elements.featuredSeries.querySelector('.hero-carousel');
    const slides = carouselContainer.querySelectorAll('.hero-slide');
    const dots = carouselContainer.querySelectorAll('.hero-dot');
    const prevButton = carouselContainer.querySelector('.hero-control.prev');
    const nextButton = carouselContainer.querySelector('.hero-control.next');
    let currentSlide = 0;
    let autoPlayInterval;

    const showSlide = (index) => {
        
        const newIndex = ((index % slides.length) + slides.length) % slides.length;
        
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            slide.style.zIndex = 0;
            if (i === newIndex) {
                slide.classList.add('active');
                slide.style.zIndex = 1;
            }
        });
        
        dots.forEach((dot, i) => {
            dot.classList.remove('active');
            if (i === newIndex) {
                dot.classList.add('active');
            }
        });
        
        currentSlide = newIndex;
    };

    const startAutoPlay = () => {
        stopAutoPlay(); 
        autoPlayInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
    };

    const stopAutoPlay = () => {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    };

    // Navegación con los dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(index);
            stopAutoPlay();
            startAutoPlay(); 
        });
    });

    // Navegación con los botones
    prevButton.addEventListener('click', () => {
        showSlide(currentSlide - 1);
        stopAutoPlay();
        startAutoPlay(); 
    });

    nextButton.addEventListener('click', () => {
        showSlide(currentSlide + 1);
        stopAutoPlay();
        startAutoPlay(); // Reinicia el autoplay después del clic
    });

    // Pausar autoplay cuando el mouse está sobre el carrusel
    carouselContainer.addEventListener('mouseenter', stopAutoPlay);
    
    // Reanudar autoplay cuando el mouse sale del carrusel
    carouselContainer.addEventListener('mouseleave', startAutoPlay);

   
    const heroButtons = carouselContainer.querySelectorAll('.hero-movie__button');
    heroButtons.forEach(button => {
        button.addEventListener('click', () => {
            const movieId = button.closest('.hero-slide').dataset.movieId;
            showSeriesDetails(movieId);
        });
    });

    // Inicia el autoplay al cargar
    startAutoPlay();
};

// Cargar series populares
const loadPopularSeries = async () => {
    const data = await fetchData('/tv/popular');
    if (!data) return;

    const seriesToShow = data.results.slice(0, 22);

    elements.popularSeries.innerHTML = seriesToShow
        .map(series => `
            <div class="movie-card" data-series-id="${series.id}">
                <img src="${getImageUrl(series.poster_path)}" 
                     alt="${series.name}"
                     loading="lazy">
                <div class="movie-card__info">
                    <h3>${series.name}</h3>
                </div>
            </div>
        `).join('');

    // Event listeners para las  series
    const seriesCards = document.querySelectorAll('.movie-card');
    seriesCards.forEach(card => {
        card.addEventListener('click', () => {
            showSeriesDetails(card.dataset.seriesId);
        });
    });
};

// Cargar géneros de series
const loadGenres = async () => {
    const data = await fetchData('/genre/tv/list');
    if (!data) return;

    state.genres = data.genres;
    elements.genresList.innerHTML = `
        <button class="genre-button" data-genre-id="all">
            Todos
        </button>
        ${data.genres
            .map(genre => `
                <button class="genre-button" data-genre-id="${genre.id}">
                    ${genre.name}
                </button>
            `).join('')}
    `;

    // Event listeners para los botones de género
    const genreButtons = document.querySelectorAll('.genre-button');
    genreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const genreId = button.dataset.genreId;
            if (genreId === 'all') {
                loadPopularSeries();
            } else {
                filterSeriesByGenre(genreId);
            }
        });
    });
};

// Filtrar series por género
const filterSeriesByGenre = async (genreId) => {
    const data = await fetchData(`/discover/tv?with_genres=${genreId}`);
    if (!data) return;
    
    const seriesToShow = data.results.slice(0, 22);
    elements.popularSeries.innerHTML = seriesToShow
        .map(series => `
            <div class="movie-card" data-series-id="${series.id}">
                <img src="${getImageUrl(series.poster_path)}" 
                     alt="${series.name}"
                     loading="lazy">
                <div class="movie-card__info">
                    <h3>${series.name}</h3>
                </div>
            </div>
        `).join('');

        const genreButtons = document.querySelectorAll('.genre-button');
        genreButtons.forEach(button => {
            if (button.dataset.genreId === genreId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    
        // Agrega event listeners a las nuevas tarjetas de películas
        const movieCards = document.querySelectorAll('.movie-card');
        movieCards.forEach(card => {
            card.addEventListener('click', () => {
                showSeriesDetails(card.dataset.seriesId);
            });
        });
};

// Mostrar detalles de la serie
const showSeriesDetails = async (seriesId) => {
    const data = await fetchData(`/tv/${seriesId}`);
    if (!data) return;

    elements.seriesModal.innerHTML = `
        <div class="modal__content">
            <button class="modal__close" aria-label="Cerrar modal">
                <i class="fas fa-times"></i>
            </button>
            <img src="${getImageUrl(data.backdrop_path, 'original')}" 
                 alt="${data.name}">
            <h2>${data.name}</h2>
            <p>${data.overview}</p> 
            <div class="modal__info">
                <span>Valoración⭐: ${data.vote_average}</span>
                <span>Año: ${data.first_air_date.split('-')[0]}</span>
                <span>Temporadas: ${data.number_of_seasons}</span>
                <span>Episodios: ${data.number_of_episodes}</span>
            </div>
        </div>
    `;
    
    elements.seriesModal.setAttribute('aria-hidden', 'false');
    
    const closeButton = elements.seriesModal.querySelector('.modal__close');
    closeButton.addEventListener('click', closeModal);
    document.addEventListener('keydown', handleEscapeKey);
    elements.seriesModal.addEventListener('click', handleOutsideClick);
};

const closeModal = () => {
    elements.seriesModal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleEscapeKey);
    elements.seriesModal.removeEventListener('click', handleOutsideClick);
};

const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
};

const handleOutsideClick = (e) => {
    if (e.target === elements.seriesModal) {
        closeModal();
    }
};


// Búsqueda de series
const searchSeries = async (query) => {
    try {
        console.log('Buscando series:', query);
        const data = await fetchData(`/search/tv?query=${encodeURIComponent(query)}`);
        console.log('Resultados:', data);
        
        if (!data || !data.results) return;

        let searchResults = document.querySelector('.search-results');
        if (!searchResults) {
            searchResults = document.createElement('div');
            searchResults.className = 'search-results';
            elements.searchInput.parentElement.appendChild(searchResults);
        }

        if (data.results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-results__message">
                    No se encontraron series para "${query}"
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = `
            <div class="search-results__content">
                ${data.results.slice(0, 5).map(series => `
                    <div class="search-result-item" data-series-id="${series.id}">
                        <img src="${getImageUrl(series.poster_path, 'w92')}" 
                             alt="${series.name}"
                             onerror="this.src='placeholder.jpg'">
                        <div class="search-result-item__info">
                            <h4>${series.name}</h4>
                            <span>${series.first_air_date ? series.first_air_date.split('-')[0] : 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        searchResults.style.display = 'block';

        const resultItems = searchResults.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                showSeriesDetails(item.dataset.seriesId);
                searchResults.style.display = 'none';
                elements.searchInput.value = '';
            });
        });
    } catch (error) {
        console.error('Error en la búsqueda de series:', error);
    }
};
const setupEventListeners = () => {
    // Alterna la pagina tema oscuro/claro
    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', state.currentTheme);
    });
     // Búsqueda con debounce
    elements.searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        const searchResults = document.querySelector('.search-results');
        
        if (query.length < 2) {
            if (searchResults) searchResults.style.display = 'none';
            return;
        }
        
        await searchSeries(query);
    }, 500));
    // Cierra  haciendo click afuera
    document.addEventListener('click', (e) => {
        const searchResults = document.querySelector('.search-results');
        const searchContainer = elements.searchInput.parentElement;
        
        if (!searchContainer.contains(e.target) && searchResults) {
            searchResults.style.display = 'none';
        }
    });
    // Cierra búsqueda con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const searchResults = document.querySelector('.search-results');
            if (searchResults) searchResults.style.display = 'none';
            elements.searchInput.value = '';
        }
    });
    // muestra detalles de la serie al hacer clic en una tarjeta
    document.addEventListener('click', (e) => {
        const seriesCard = e.target.closest('[data-series-id]');
        if (seriesCard) {
            showSeriesDetails(seriesCard.dataset.seriesId);
        }
    });

        //boton hamburguesa para el nav
        const toggleButton = document.querySelector(".nav__toggle");
        const menu = document.querySelector(".nav__menu");
    
        if (toggleButton && menu) {
            toggleButton.addEventListener("click", () => {
                menu.classList.toggle("active");
            });
        }

};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

//INICIA TODOS LOS MODULOS
const init = async () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    state.currentTheme = savedTheme;

    await Promise.all([
        loadTrending(),
        loadPopularSeries(),
        loadGenres(),
        loadHeroSeries()
    ]);

    setupEventListeners();
};

document.addEventListener('DOMContentLoaded', init);