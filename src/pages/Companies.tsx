// src/pages/Companies.tsx
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Menu   from '../components/Menu';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Empresa {
  id:       string;
  nombre:   string;
  url:      string;
  categoria: string;
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const EMPRESAS: Empresa[] = [
  // A
  { id:'accenture',      nombre:'Accenture',             url:'https://www.accenture.com/ar-es/careers',                                         categoria:'Consultoría / IT' },
  { id:'aerolineas',     nombre:'Aerolíneas Argentinas',  url:'https://www.aerolineas.com.ar/ar-es/home/trabaja_con_nosotros',                   categoria:'Aviación' },
  { id:'andreani',       nombre:'Andreani',               url:'https://www.andreani.com/institucional/trabaja-con-nosotros',                      categoria:'Logística' },
  { id:'arcor',          nombre:'Arcor',                  url:'https://www.arcor.com.ar/institucional/trabaja-con-nosotros',                      categoria:'Alimentos' },
  { id:'astrazeneca',    nombre:'AstraZeneca',            url:'https://careers.astrazeneca.com/',                                                 categoria:'Farmacéutica' },
  { id:'atento',         nombre:'Atento',                 url:'https://www.atento.com/es/trabaja-con-nosotros/',                                  categoria:'Contact Center' },
  { id:'amazon',         nombre:'Amazon',                 url:'https://www.amazon.jobs/',                                                         categoria:'Tecnología' },
  // B
  { id:'banco-ciudad',   nombre:'Banco Ciudad',           url:'https://www.bancociudad.com.ar/institucional/trabaja-con-nosotros',                categoria:'Banca' },
  { id:'banco-galicia',  nombre:'Banco Galicia',          url:'https://www.galicia.ar/personas/institucional/trabaja-con-nosotros',               categoria:'Banca' },
  { id:'banco-macro',    nombre:'Banco Macro',            url:'https://www.macro.com.ar/institucional/trabaja-con-nosotros',                      categoria:'Banca' },
  { id:'banco-nacion',   nombre:'Banco Nación',           url:'https://www.bna.com.ar/institucional/trabajaconnosotros',                          categoria:'Banca pública' },
  { id:'banco-patagonia',nombre:'Banco Patagonia',        url:'https://www.bancopatagonia.com.ar/institucional/trabaja-con-nosotros',              categoria:'Banca' },
  { id:'banco-provincia',nombre:'Banco Provincia',        url:'https://www.bpba.com.ar/institucional/trabaja-con-nosotros',                       categoria:'Banca pública' },
  { id:'banco-santander',nombre:'Banco Santander',        url:'https://www.santander.com.ar/banco/online/institucional/trabaja-con-nosotros',     categoria:'Banca' },
  { id:'banco-supervielle',nombre:'Banco Supervielle',   url:'https://www.supervielle.com.ar/institucional/trabaja-con-nosotros',                 categoria:'Banca' },
  { id:'bayer',          nombre:'Bayer Argentina',        url:'https://career.bayer.com/',                                                        categoria:'Farmacéutica' },
  { id:'bbva',           nombre:'BBVA Argentina',         url:'https://www.bbva.com.ar/general/trabaja-con-nosotros.html',                        categoria:'Banca' },
  { id:'brubank',        nombre:'Brubank',                url:'https://www.brubank.com.ar/trabaja-con-nosotros',                                   categoria:'Fintech' },
  { id:'bumeran',        nombre:'Bumeran',                url:'https://www.bumeran.com.ar/institucional/trabaja-con-nosotros',                    categoria:'RRHH / Empleo' },
  // C
  { id:'carrefour',      nombre:'Carrefour Argentina',    url:'https://www.carrefour.com.ar/institucional/trabaja-con-nosotros',                  categoria:'Retail' },
  { id:'cencosud',       nombre:'Cencosud',               url:'https://www.cencosud.com/trabaja-con-nosotros/',                                   categoria:'Retail' },
  { id:'cisco',          nombre:'Cisco Argentina',        url:'https://jobs.cisco.com/',                                                          categoria:'Tecnología' },
  { id:'claro',          nombre:'Claro Argentina',        url:'https://www.claro.com.ar/personas/institucional/trabaja-con-nosotros/',             categoria:'Telecomunicaciones' },
  { id:'coca-cola',      nombre:'Coca-Cola Argentina',    url:'https://www.coca-colacompany.com/careers',                                         categoria:'Alimentos / Bebidas' },
  { id:'cognizant',      nombre:'Cognizant Argentina',    url:'https://careers.cognizant.com/',                                                   categoria:'IT / Consultoría' },
  { id:'correo-arg',     nombre:'Correo Argentino',       url:'https://www.correoargentino.com.ar/institucional/trabaja-con-nosotros',             categoria:'Correo / Logística' },
  { id:'coto',           nombre:'Coto',                   url:'https://www.coto.com.ar/institucional/trabaja-con-nosotros',                       categoria:'Supermercado' },
  // D
  { id:'deloitte',       nombre:'Deloitte Argentina',     url:'https://www2.deloitte.com/ar/es/pages/careers/topics/careers.html',                categoria:'Consultoría' },
  { id:'dell',           nombre:'Dell Argentina',         url:'https://jobs.dell.com/',                                                           categoria:'Tecnología' },
  { id:'despegar',       nombre:'Despegar',               url:'https://careers.despegar.com/',                                                    categoria:'Turismo / Tecnología' },
  { id:'dhl',            nombre:'DHL Argentina',          url:'https://www.dhl.com/ar-es/home/careers.html',                                     categoria:'Logística' },
  { id:'directv',        nombre:'DirecTV Argentina',      url:'https://careers.directv.com/',                                                     categoria:'Telecomunicaciones' },
  // E
  { id:'ericsson',       nombre:'Ericsson Argentina',     url:'https://jobs.ericsson.com/',                                                       categoria:'Telecomunicaciones' },
  { id:'ey',             nombre:'EY Argentina',           url:'https://www.ey.com/es_ar/careers',                                                 categoria:'Consultoría' },
  // F
  { id:'falabella',      nombre:'Falabella Argentina',    url:'https://www.falabella.com.ar/falabella-ar/page/trabaja-con-nosotros',               categoria:'Retail' },
  { id:'farmacity',      nombre:'Farmacity',              url:'https://www.farmacity.com/institucional/trabaja-con-nosotros',                     categoria:'Salud / Retail' },
  { id:'fedex',          nombre:'FedEx Argentina',        url:'https://careers.fedex.com/',                                                       categoria:'Logística' },
  { id:'fiat',           nombre:'Fiat Argentina',         url:'https://www.fiat.com.ar/institucional/trabaja-con-nosotros',                       categoria:'Automotriz' },
  { id:'flybondi',       nombre:'Flybondi',               url:'https://www.flybondi.com/ar/trabaja-con-nosotros',                                 categoria:'Aviación' },
  { id:'ford',           nombre:'Ford Argentina',         url:'https://www.ford.com.ar/institucional/trabaja-con-nosotros',                       categoria:'Automotriz' },
  { id:'fravega',        nombre:'Frávega',                url:'https://www.fravega.com/institucional/trabaja-con-nosotros/',                      categoria:'Retail / Electrónica' },
  // G
  { id:'garbarino',      nombre:'Garbarino',              url:'https://www.garbarino.com/institucional/trabaja-con-nosotros',                     categoria:'Retail / Electrónica' },
  { id:'ge',             nombre:'GE Argentina',           url:'https://jobs.gecareers.com/',                                                      categoria:'Industria' },
  { id:'gm',             nombre:'General Motors Argentina',url:'https://careers.gm.com/',                                                        categoria:'Automotriz' },
  { id:'globant',        nombre:'Globant',                url:'https://www.globant.com/careers/',                                                 categoria:'IT / Tecnología' },
  { id:'google',         nombre:'Google Argentina',       url:'https://careers.google.com/',                                                      categoria:'Tecnología' },
  // H
  { id:'hcl',            nombre:'HCL Argentina',          url:'https://www.hcltech.com/careers',                                                  categoria:'IT' },
  { id:'honda',          nombre:'Honda Argentina',        url:'https://www.honda.com.ar/institucional/trabaja-con-nosotros',                      categoria:'Automotriz' },
  { id:'honeywell',      nombre:'Honeywell Argentina',    url:'https://careers.honeywell.com/',                                                   categoria:'Industria / Tecnología' },
  { id:'hp',             nombre:'HP Argentina',           url:'https://jobs.hp.com/',                                                             categoria:'Tecnología' },
  { id:'hsbc',           nombre:'HSBC Argentina',         url:'https://www.hsbc.com.ar/1/2/home/trabaja-con-nosotros',                            categoria:'Banca' },
  // I
  { id:'ibm',            nombre:'IBM Argentina',          url:'https://www.ibm.com/ar-es/employment/',                                            categoria:'Tecnología' },
  { id:'icbc',           nombre:'ICBC Argentina',         url:'https://www.icbc.com.ar/institucional/trabaja-con-nosotros',                       categoria:'Banca' },
  { id:'infosys',        nombre:'Infosys Argentina',      url:'https://www.infosys.com/careers/',                                                 categoria:'IT' },
  { id:'intel',          nombre:'Intel Argentina',        url:'https://jobs.intel.com/',                                                          categoria:'Tecnología' },
  { id:'invap',          nombre:'INVAP',                  url:'https://www.invap.com.ar/institucional/trabaja-con-nosotros',                      categoria:'Tecnología / Estado' },
  { id:'itau',           nombre:'Itaú Argentina',         url:'https://www.itau.com.ar/institucional/trabaja-con-nosotros',                       categoria:'Banca' },
  // J
  { id:'jnj',            nombre:'Johnson & Johnson',      url:'https://jobs.jnj.com/',                                                            categoria:'Farmacéutica' },
  { id:'jpmorgan',       nombre:'JPMorgan Argentina',     url:'https://careers.jpmorgan.com/',                                                    categoria:'Banca' },
  // K
  { id:'kpmg',           nombre:'KPMG Argentina',         url:'https://home.kpmg/ar/es/home/careers.html',                                       categoria:'Consultoría' },
  // L
  { id:'la-anonima',     nombre:'La Anónima',             url:'https://www.la-anonima.com.ar/institucional/trabaja-con-nosotros',                 categoria:'Supermercado' },
  { id:'latam',          nombre:'LATAM Airlines Argentina',url:'https://careers.latam.com/',                                                     categoria:'Aviación' },
  { id:'lemon',          nombre:'Lemon Cash',             url:'https://www.lemon.me/trabaja-con-nosotros',                                        categoria:'Fintech / Cripto' },
  { id:'lenovo',         nombre:'Lenovo Argentina',       url:'https://jobs.lenovo.com/',                                                         categoria:'Tecnología' },
  { id:'loma-negra',     nombre:'Loma Negra',             url:'https://www.lomanegra.com.ar/trabaja-con-nosotros/',                               categoria:'Construcción / Industria' },
  // M
  { id:'mastercard',     nombre:'Mastercard Argentina',   url:'https://careers.mastercard.com/',                                                  categoria:'Fintech / Pagos' },
  { id:'mastellone',     nombre:'Mastellone (La Serenísima)',url:'https://www.mastellone.com.ar/institucional/trabaja-con-nosotros',              categoria:'Alimentos / Lácteos' },
  { id:'mckinsey',       nombre:'McKinsey Argentina',     url:'https://www.mckinsey.com/careers',                                                 categoria:'Consultoría' },
  { id:'mercadolibre',   nombre:'Mercado Libre',          url:'https://jobs.mercadolibre.com/',                                                   categoria:'E-commerce / Tecnología' },
  { id:'mercadopago',    nombre:'Mercado Pago',           url:'https://jobs.mercadolibre.com/',                                                   categoria:'Fintech' },
  { id:'microsoft',      nombre:'Microsoft Argentina',    url:'https://careers.microsoft.com/',                                                   categoria:'Tecnología' },
  { id:'molinos',        nombre:'Molinos Río de la Plata',url:'https://www.molinos.com.ar/institucional/trabaja-con-nosotros',                    categoria:'Alimentos' },
  { id:'motorola',       nombre:'Motorola Solutions',     url:'https://motorolasolutions.com/careers',                                            categoria:'Tecnología' },
  { id:'movistar',       nombre:'Movistar Argentina',     url:'https://www.movistar.com.ar/institucional/trabaja-con-nosotros',                   categoria:'Telecomunicaciones' },
  // N
  { id:'naranjax',       nombre:'Naranja X',              url:'https://naranjax.com/trabaja-con-nosotros',                                        categoria:'Fintech' },
  { id:'nestle',         nombre:'Nestlé Argentina',       url:'https://www.nestle.com.ar/careers',                                                categoria:'Alimentos' },
  { id:'netflix',        nombre:'Netflix',                url:'https://jobs.netflix.com/',                                                        categoria:'Tecnología / Medios' },
  { id:'nokia',          nombre:'Nokia Argentina',        url:'https://careers.nokia.com/',                                                       categoria:'Telecomunicaciones' },
  { id:'novartis',       nombre:'Novartis Argentina',     url:'https://www.novartis.com/careers',                                                 categoria:'Farmacéutica' },
  { id:'nuvei',          nombre:'Nuvei',                  url:'https://www.nuvei.com/careers',                                                    categoria:'Fintech' },
  // O
  { id:'oca',            nombre:'OCA',                    url:'https://www.oca.com.ar/institucional/trabaja-con-nosotros',                        categoria:'Logística' },
  { id:'oracle',         nombre:'Oracle Argentina',       url:'https://www.oracle.com/careers/',                                                  categoria:'Tecnología' },
  // P
  { id:'pae',            nombre:'Pan American Energy',    url:'https://www.panamericanenergy.com/es/carreras',                                    categoria:'Energía / Oil & Gas' },
  { id:'pepsico',        nombre:'PepsiCo Argentina',      url:'https://www.pepsicojobs.com/',                                                     categoria:'Alimentos / Bebidas' },
  { id:'personal',       nombre:'Personal (Telecom)',      url:'https://www.personal.com.ar/institucional/trabaja-con-nosotros',                  categoria:'Telecomunicaciones' },
  { id:'pfizer',         nombre:'Pfizer Argentina',       url:'https://www.pfizer.com/careers',                                                   categoria:'Farmacéutica' },
  { id:'prisma',         nombre:'Prisma Medios de Pago',  url:'https://www.prismamediosdepago.com/institucional/trabaja-con-nosotros',            categoria:'Fintech / Pagos' },
  { id:'pg',             nombre:'Procter & Gamble',       url:'https://www.pgcareers.com/',                                                       categoria:'Consumo masivo' },
  { id:'prosegur',       nombre:'Prosegur Argentina',     url:'https://www.prosegur.com.ar/trabaja-con-nosotros',                                 categoria:'Seguridad' },
  { id:'pwc',            nombre:'PwC Argentina',          url:'https://www.pwc.com.ar/es/careers.html',                                           categoria:'Consultoría' },
  // Q
  { id:'quilmes',        nombre:'Quilmes (AB InBev)',      url:'https://www.ab-inbev.com/careers/',                                               categoria:'Bebidas / Industria' },
  // R
  { id:'rappi',          nombre:'Rappi Argentina',        url:'https://about.rappi.com/es/careers',                                              categoria:'Delivery / Tecnología' },
  { id:'renault',        nombre:'Renault Argentina',      url:'https://www.renault.com.ar/institucional/trabaja-con-nosotros',                    categoria:'Automotriz' },
  { id:'ripio',          nombre:'Ripio',                  url:'https://ripio.com/careers/',                                                       categoria:'Fintech / Cripto' },
  { id:'roche',          nombre:'Roche Argentina',        url:'https://www.roche.com/careers',                                                    categoria:'Farmacéutica' },
  // S
  { id:'sap',            nombre:'SAP Argentina',          url:'https://www.sap.com/careers/',                                                     categoria:'Tecnología' },
  { id:'salesforce',     nombre:'Salesforce Argentina',   url:'https://www.salesforce.com/company/careers/',                                      categoria:'Tecnología / CRM' },
  { id:'sancor',         nombre:'Sancor',                 url:'https://www.sancor.com/institucional/trabaja-con-nosotros',                        categoria:'Alimentos / Lácteos' },
  { id:'securitas',      nombre:'Securitas Argentina',    url:'https://www.securitas.com.ar/trabaja-con-nosotros/',                               categoria:'Seguridad' },
  { id:'siemens',        nombre:'Siemens Argentina',      url:'https://jobs.siemens.com/',                                                        categoria:'Industria / Energía' },
  { id:'sodimac',        nombre:'Sodimac Argentina',      url:'https://www.sodimac.com.ar/sodimac-ar/category/cat10001/trabaja-con-nosotros',     categoria:'Retail / Construcción' },
  // T
  { id:'tcs',            nombre:'Tata Consultancy Services',url:'https://www.tcs.com/careers',                                                   categoria:'IT / Consultoría' },
  { id:'techint',        nombre:'Techint',                url:'https://www.techint.com/careers/',                                                 categoria:'Ingeniería / Industria' },
  { id:'telecom',        nombre:'Telecom Argentina',      url:'https://www.telecom.com.ar/empleos',                                               categoria:'Telecomunicaciones' },
  { id:'tenaris',        nombre:'Tenaris',                url:'https://www.tenaris.com/es/careers/',                                              categoria:'Industria / Acero' },
  { id:'ternium',        nombre:'Ternium Argentina',      url:'https://www.ternium.com/es/careers/',                                              categoria:'Industria / Acero' },
  { id:'toyota',         nombre:'Toyota Argentina',       url:'https://www.toyota.com.ar/institucional/trabaja-con-nosotros',                     categoria:'Automotriz' },
  // U
  { id:'uala',           nombre:'Ualá',                   url:'https://www.uala.com.ar/trabaja-con-nosotros',                                     categoria:'Fintech' },
  { id:'unilever',       nombre:'Unilever Argentina',     url:'https://www.unilever.com.ar/careers/',                                             categoria:'Consumo masivo' },
  { id:'ups',            nombre:'UPS Argentina',          url:'https://www.jobs-ups.com/',                                                        categoria:'Logística' },
  // V
  { id:'visa',           nombre:'Visa Argentina',         url:'https://usa.visa.com/careers.html',                                               categoria:'Fintech / Pagos' },
  { id:'vw',             nombre:'Volkswagen Argentina',   url:'https://www.vw.com.ar/institucional/trabaja-con-nosotros',                         categoria:'Automotriz' },
  // W
  { id:'walmart',        nombre:'Walmart Argentina',      url:'https://careers.walmart.com/',                                                     categoria:'Retail' },
  { id:'western-union',  nombre:'Western Union Argentina',url:'https://careers.westernunion.com/',                                               categoria:'Finanzas / Pagos' },
  { id:'wipro',          nombre:'Wipro Argentina',        url:'https://careers.wipro.com/',                                                       categoria:'IT' },
  // Y
  { id:'ypf',            nombre:'YPF',                    url:'https://www.ypf.com/EnergiaYPF/Pages/trabaja-con-nosotros.aspx',                  categoria:'Energía / Oil & Gas' },
  // Z
  { id:'zonaprop',       nombre:'ZonaProp',               url:'https://www.zonaprop.com.ar/institucional/trabaja-con-nosotros',                   categoria:'Inmobiliaria / Tecnología' },
];

function getInicial(nombre: string): string {
  return nombre?.trim()?.[0]?.toUpperCase() || '?';
}

export default function Companies() {
  const [letraActiva, setLetraActiva] = useState('A');
  const [busqueda,    setBusqueda]    = useState('');
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);

  const modoBusqueda = busqueda.trim().length > 0;

  const empresasMostradas = modoBusqueda
    ? EMPRESAS.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()))
    : EMPRESAS.filter(e => getInicial(e.nombre) === letraActiva);

  const handleLetra = (letra: string) => { setLetraActiva(letra); setBusqueda(''); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-black text-[--sc-700] dark:text-white tracking-tighter">Empresas A-Z</h1>
        <p className="text-gray-400 text-xs">
          {empresasMostradas.length} empresa{empresasMostradas.length !== 1 ? 's' : ''} encontrada{empresasMostradas.length !== 1 ? 's' : ''}
        </p>
      </header>

      {/* Buscador */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 dark:text-white"
            aria-label="Buscar empresa"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="text-gray-400 text-xs font-bold px-1" aria-label="Limpiar">✕</button>
          )}
        </div>
      </div>

      {/* Selector de letra */}
      {!modoBusqueda && (
        <div className="px-4 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {LETRAS.map(l => (
              <button
                key={l}
                onClick={() => handleLetra(l)}
                aria-pressed={letraActiva === l}
                className={`w-9 h-9 rounded-xl text-sm font-black transition-all active:scale-90 ${
                  letraActiva === l
                    ? 'bg-[--sc-500] text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="px-4 pt-5 space-y-3">
        {empresasMostradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              {modoBusqueda
                ? `Sin resultados para "${busqueda}"`
                : <>No hay empresas con la letra <span className="text-[--sc-500] font-black">{letraActiva}</span></>
              }
            </p>
          </div>
        )}

        {empresasMostradas.map(empresa => (
          <div
            key={empresa.id}
            className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[--sc-100] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-[--sc-700] font-black text-lg">{getInicial(empresa.nombre)}</span>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-sm">{empresa.nombre}</p>
                <p className="text-xs text-gray-400">{empresa.categoria}</p>
              </div>
            </div>
            <a
              href={empresa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 active:scale-95 transition-transform"
              aria-label={`Postularse en ${empresa.nombre}`}
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-[--sc-500]" />
            </a>
          </div>
        ))}
      </div>

      <Navbar onMenuClick={() => setIsMenuOpen(true)} />
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
    }
