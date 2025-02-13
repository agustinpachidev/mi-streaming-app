const API_KEY = 'a5b213a231ca671a9dd83f1bacd9d982';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Cache de elementos DOM
const elements = {
    trendingCarousel: document.getElementById('trendingCarousel'),
    popularMovies: document.getElementById('popularMovies'),
    genresList: document.getElementById('genresList'),
    movieModal: document.getElementById('movieModal'),
    searchInput: document.querySelector('.search-bar input'),
    themeToggle: document.querySelector('.theme-toggle'),
    featuredMovies: document.getElementById('featuredMovies') //  línea nueva
};

// Estado de la aplicación
const state = {
    currentTheme: 'light',
    movies: [],
    genres: []
};

// Funciones de utilidad
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

// Funciones principales
const loadTrending = async () => {
    const data = await fetchData('/trending/movie/week');
    if (!data) return;

    elements.trendingCarousel.innerHTML = `
        <div class="trending-carousel-container">
            <div class="trending-carousel-wrapper">
                ${data.results.slice(0, 20).map(movie => `
                    <div class="carousel-item" data-movie-id="${movie.id}">
                        <img src="${getImageUrl(movie.poster_path)}" 
                             alt="${movie.title}"
                             loading="lazy">
                        <div class="carousel-item__info">
                            <h3>${movie.title}</h3>
                            <span class="rating">
                                <i class="fas fa-star"></i>
                                ${movie.vote_average.toFixed(1)}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="trending-controls">
                <button class="trending-control prev" aria-label="Anterior película en tendencia">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="trending-control next" aria-label="Siguiente película en tendencia">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="trending-indicators">
                ${data.results.slice(0, 10).map((_, index) => `
                    <button class="trending-dot ${index === 0 ? 'active' : ''}" 
                            data-slide="${index}" 
                            aria-label="Ir a la película en tendencia ${index + 1}">
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Obtener referencias a los elementos
    const carouselWrapper = elements.trendingCarousel.querySelector('.trending-carousel-wrapper');
    const items = elements.trendingCarousel.querySelectorAll('.carousel-item');
    const dots = elements.trendingCarousel.querySelectorAll('.trending-dot');
    const prevButton = elements.trendingCarousel.querySelector('.trending-control.prev');
    const nextButton = elements.trendingCarousel.querySelector('.trending-control.next');
    
    let currentIndex = 0;
    const itemsToShow = 5; // Número de películas visibles a la vez
    const totalItems = items.length;

    const showSlide = (index) => {
        // Asegurarse de que el índice esté dentro de los límites
        currentIndex = Math.max(0, Math.min(index, totalItems - itemsToShow));
        
        // Calcular el desplazamiento
        const offset = -(currentIndex * (100 / itemsToShow));
        carouselWrapper.style.transform = `translateX(${offset}%)`;
        
        // Actualizar dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        // Actualizar estado de los botones
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

    // Inicializar el carrusel
    showSlide(0);
};
//SCRIPT SECCION HERO
const loadHeroMovies = async () => {
    const data = await fetchData('/movie/popular');
    if (!data) return;

    const heroMovies = data.results.slice(0, 5);

    elements.featuredMovies.innerHTML = `
        <div class="hero-carousel">
            ${heroMovies.map((movie, index) => `
                <div class="hero-slide ${index === 0 ? 'active' : ''}" 
                     data-movie-id="${movie.id}" 
                     style="z-index: ${index === 0 ? 1 : 0}">
                    <img src="${getImageUrl(movie.backdrop_path, 'original')}" 
                         alt="${movie.title}"
                         loading="${index === 0 ? 'eager' : 'lazy'}">
                    <div class="hero-overlay"></div>
                    <div class="hero__content">
                        <h2>${movie.title}</h2>
                        <p>${movie.overview}</p>
                        <button class="hero-movie__button" aria-label="Ver detalles de ${movie.title}">
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
                ${heroMovies.map((_, index) => `
                    <button class="hero-dot ${index === 0 ? 'active' : ''}" 
                            data-slide="${index}" 
                            aria-label="Ir a la película ${index + 1}"></button>
                `).join('')}
            </div>
        </div>
    `;

    // Obtener el contenedor principal del carrusel
    const carouselContainer = elements.featuredMovies.querySelector('.hero-carousel');
    const slides = carouselContainer.querySelectorAll('.hero-slide');
    const dots = carouselContainer.querySelectorAll('.hero-dot');
    const prevButton = carouselContainer.querySelector('.hero-control.prev');
    const nextButton = carouselContainer.querySelector('.hero-control.next');
    let currentSlide = 0;
    let autoPlayInterval;

    const showSlide = (index) => {
        // Asegurar que el índice esté dentro de los límites (loop)
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
        stopAutoPlay(); // Primero detenemos cualquier intervalo existente
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
            startAutoPlay(); // Reiniciar el autoplay después del clic
        });
    });

    // Navegación con los botones
    prevButton.addEventListener('click', () => {
        showSlide(currentSlide - 1);
        stopAutoPlay();
        startAutoPlay(); // Reiniciar el autoplay después del clic
    });

    nextButton.addEventListener('click', () => {
        showSlide(currentSlide + 1);
        stopAutoPlay();
        startAutoPlay(); // Reiniciar el autoplay después del clic
    });

    // Pausar autoplay cuando el mouse está sobre el carrusel
    carouselContainer.addEventListener('mouseenter', stopAutoPlay);
    
    // Reanudar autoplay cuando el mouse sale del carrusel
    carouselContainer.addEventListener('mouseleave', startAutoPlay);

    // Agregar event listeners a los botones "Ver más"
    const heroButtons = carouselContainer.querySelectorAll('.hero-movie__button');
    heroButtons.forEach(button => {
        button.addEventListener('click', () => {
            const movieId = button.closest('.hero-slide').dataset.movieId;
            showMovieDetails(movieId);
        });
    });

    // Iniciar el autoplay al cargar
    startAutoPlay();
};
//FIN DE SCRIPT SECCION HERO
const loadPopularMovies = async () => {
    const data = await fetchData('/movie/popular');
    if (!data) return;

    const moviesToShow = data.results.slice(0, 18);

    elements.popularMovies.innerHTML = moviesToShow
        .map(movie => `
            <div class="movie-card" data-movie-id="${movie.id}">
                <img src="${getImageUrl(movie.poster_path)}" 
                     alt="${movie.title}"
                     loading="lazy">
                <div class="movie-card__info">
                    <h3>${movie.title}</h3>
                </div>
            </div>
        `).join('');

    // Agrega event listeners a las tarjetas de películas
    const movieCards = document.querySelectorAll('.movie-card');
    movieCards.forEach(card => {
        card.addEventListener('click', () => {
            showMovieDetails(card.dataset.movieId);
        });
    });
};

const loadGenres = async () => {
    const data = await fetchData('/genre/movie/list');
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

    // Agrega event listeners a los botones de género
    const genreButtons = document.querySelectorAll('.genre-button');
    genreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const genreId = button.dataset.genreId;
            if (genreId === 'all') {
                loadPopularMovies(); // Vuelve a cargar todas las películas
            } else {
                filterMoviesByGenre(genreId);
            }
        });
    });
};
//nuevo script
const filterMoviesByGenre = async (genreId) => {
    const data = await fetchData(`/discover/movie?with_genres=${genreId}`);
    if (!data) return;
    const moviesToShow = data.results.slice(0, 18);

    // Limpia el contenedor de películas populares
    elements.popularMovies.innerHTML = '';

    // Muestra las películas filtradas
    elements.popularMovies.innerHTML = moviesToShow
        .map(movie => `
            <div class="movie-card" data-movie-id="${movie.id}">
                <img src="${getImageUrl(movie.poster_path)}" 
                     alt="${movie.title}"
                     loading="lazy">
                <div class="movie-card__info">
                    <h3>${movie.title}</h3>
                    
                </div>
            </div>
        `).join('');

    // Resalta el botón del género seleccionado
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
            showMovieDetails(card.dataset.movieId);
        });
    });
};
//termina codigo
const showMovieDetails = async (movieId) => {
    const data = await fetchData(`/movie/${movieId}`);
    if (!data) return;

    elements.movieModal.innerHTML = `
        <div class="modal__content">
            <button class="modal__close" aria-label="Cerrar modal">
                <i class="fas fa-times"></i>
            </button>
            <img src="${getImageUrl(data.backdrop_path, 'original')}" 
                 alt="${data.title}">
            <h2>${data.title}</h2>
            <p>${data.overview}</p> 
            <div class="modal__info">
                <span>Valoración⭐: ${data.vote_average}</span>
                <span>Año: ${data.release_date.split('-')[0]}</span>
                <span>Duración: ${data.runtime} min</span>
            </div>
        </div>
    `;
    elements.movieModal.setAttribute('aria-hidden', 'false');
    
    const closeButton = elements.movieModal.querySelector('.modal__close');
    closeButton.addEventListener('click', closeModal);
    document.addEventListener('keydown', handleEscapeKey);
    elements.movieModal.addEventListener('click', handleOutsideClick);
};

const closeModal = () => {
    elements.movieModal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleEscapeKey);
    elements.movieModal.removeEventListener('click', handleOutsideClick);
};

const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
};

const handleOutsideClick = (e) => {
    if (e.target === elements.movieModal) {
        closeModal();
    }
};

const searchMovies = async (query) => {
    try {
        console.log('Buscando:', query);
        const data = await fetchData(`/search/movie?query=${encodeURIComponent(query)}`);
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
                    No se encontraron resultados para "${query}"
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = `
            <div class="search-results__content">
                ${data.results.slice(0, 5).map(movie => `
                    <div class="search-result-item" data-movie-id="${movie.id}">
                        <img src="${getImageUrl(movie.poster_path, 'w92')}" 
                             alt="${movie.title}"
                             onerror="this.src='placeholder.jpg'">
                        <div class="search-result-item__info">
                            <h4>${movie.title}</h4>
                            <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        searchResults.style.display = 'block';

        const resultItems = searchResults.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                showMovieDetails(item.dataset.movieId);
                searchResults.style.display = 'none';
                elements.searchInput.value = '';
            });
        });
    } catch (error) {
        console.error('Error en la búsqueda:', error);
    }
};

const setupEventListeners = () => {
    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', state.currentTheme);
    });

    elements.searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        const searchResults = document.querySelector('.search-results');
        
        if (query.length < 2) {
            if (searchResults) searchResults.style.display = 'none';
            return;
        }
        
        await searchMovies(query);
    }, 500));

    document.addEventListener('click', (e) => {
        const searchResults = document.querySelector('.search-results');
        const searchContainer = elements.searchInput.parentElement;
        
        if (!searchContainer.contains(e.target) && searchResults) {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const searchResults = document.querySelector('.search-results');
            if (searchResults) searchResults.style.display = 'none';
            elements.searchInput.value = '';
        }
    });

    document.addEventListener('click', (e) => {
        const movieCard = e.target.closest('[data-movie-id]');
        if (movieCard) {
            showMovieDetails(movieCard.dataset.movieId);
        }
    });
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

const init = async () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    state.currentTheme = savedTheme;

    await Promise.all([
        loadTrending(),
        loadPopularMovies(),
        loadGenres(),
        loadHeroMovies()
    ]);

    setupEventListeners();
};

document.addEventListener('DOMContentLoaded', init);