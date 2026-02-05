// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import React from 'react';
import './styles.css';

// components/HeroSearchV1.tsx
export default function HeroSearchV1(props) {
  return (
    <div class="relative w-full h-[650px] md:h-[800px] flex items-center justify-center overflow-hidden">
      <div
        class="hero-bg absolute inset-0 z-0 bg-gray-200"
        data-alt="Luxurious modern home interior with floor to ceiling windows overlooking a city skyline"
      ></div>
      <div class="absolute inset-0 bg-primary/40 z-0"></div>
      <div class="relative z-10 w-full max-w-7xl px-4 md:px-10 flex flex-col items-center gap-8 pt-20">
        <h1 class="text-white text-4xl md:text-6xl font-extrabold tracking-tight text-center drop-shadow-lg">
          Invest in Your <span class="text-accent">Legacy</span>
        </h1>
        <p class="text-white/90 text-lg md:text-xl font-medium text-center max-w-2xl drop-shadow-md">
          Exclusive properties and integrated financial services for high-trust
          decisions.
        </p>
        <div class="mt-8 bg-white/90 dark:bg-primary/90 backdrop-blur-md rounded-xl shadow-2xl p-6 w-full max-w-4xl border border-white/20">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <label class="flex flex-col gap-2">
              <span class="text-primary dark:text-white text-xs font-bold uppercase tracking-wider">
                Location
              </span>
              <div class="relative">
                <select class="w-full bg-gray-50 dark:bg-background-dark/50 border border-gray-200 dark:border-gray-700 text-[#101618] dark:text-white text-sm rounded-lg focus:ring-accent focus:border-accent block p-3 pr-10 appearance-none">
                  <option>Polanco, CDMX</option>
                  <option>Lomas de Chapultepec</option>
                  <option>Santa Fe</option>
                  <option>San Pedro Garza García</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </label>
            <label class="flex flex-col gap-2">
              <span class="text-primary dark:text-white text-xs font-bold uppercase tracking-wider">
                Operation
              </span>
              <div class="relative">
                <select class="w-full bg-gray-50 dark:bg-background-dark/50 border border-gray-200 dark:border-gray-700 text-[#101618] dark:text-white text-sm rounded-lg focus:ring-accent focus:border-accent block p-3 pr-10 appearance-none">
                  <option>Buy</option>
                  <option>Rent</option>
                  <option>Invest</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </label>
            <label class="flex flex-col gap-2">
              <span class="text-primary dark:text-white text-xs font-bold uppercase tracking-wider">
                Type
              </span>
              <div class="relative">
                <select class="w-full bg-gray-50 dark:bg-background-dark/50 border border-gray-200 dark:border-gray-700 text-[#101618] dark:text-white text-sm rounded-lg focus:ring-accent focus:border-accent block p-3 pr-10 appearance-none">
                  <option>Penthouse</option>
                  <option>Mansion</option>
                  <option>Apartment</option>
                  <option>Commercial</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </label>
            <button class="w-full h-[46px] bg-primary hover:bg-accent text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
              <span class="material-symbols-outlined text-xl">search</span>
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
