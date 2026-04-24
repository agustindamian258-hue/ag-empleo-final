// src/pages/Companies.tsx
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Menu   from '../components/Menu';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Empresa {
  id:        string;
  nombre:    string;
  url:       string;
  categoria: string;
  provincia: string;
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const PROVINCIAS = [
  'Todas',
  'Buenos Aires',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'San Juan',
  'San Luis',
  'Neuquén/Chubut',
  'Tucumán/Salta/Jujuy',
  'Entre Ríos/Misiones',
  'Tierra del Fuego',
  'Nacional',
] as const;

const EMPRESAS: Empresa[] = [
  // ── Nacional / Varias ──────────────────────────────────────────────────────
  { id:'accenture',        nombre:'Accenture',                  url:'https://www.accenture.com/ar-es/careers',                              categoria:'Consultoría / IT',           provincia:'Nacional' },
  { id:'aerolineas',       nombre:'Aerolíneas Argentinas',       url:'https://www.aerolineas.com.ar/ar-es/home/trabaja_con_nosotros',        categoria:'Aviación',                   provincia:'Nacional' },
  { id:'amazon',           nombre:'Amazon',                      url:'https://www.amazon.jobs/',                                             categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'atento',           nombre:'Atento',                      url:'https://www.atento.com/es/trabaja-con-nosotros/',                      categoria:'Contact Center',             provincia:'Nacional' },
  { id:'astrazeneca',      nombre:'AstraZeneca',                 url:'https://careers.astrazeneca.com/',                                     categoria:'Farmacéutica',               provincia:'Nacional' },
  { id:'bayer',            nombre:'Bayer Argentina',             url:'https://career.bayer.com/',                                            categoria:'Farmacéutica',               provincia:'Nacional' },
  { id:'bumeran',          nombre:'Bumeran',                     url:'https://www.bumeran.com.ar/',                                          categoria:'RRHH / Empleo',              provincia:'Nacional' },
  { id:'cisco',            nombre:'Cisco Argentina',             url:'https://jobs.cisco.com/',                                              categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'coca-cola',        nombre:'Coca-Cola Argentina',         url:'https://www.coca-colacompany.com/careers',                             categoria:'Alimentos / Bebidas',        provincia:'Nacional' },
  { id:'cognizant',        nombre:'Cognizant Argentina',         url:'https://careers.cognizant.com/',                                       categoria:'IT / Consultoría',           provincia:'Nacional' },
  { id:'deloitte',         nombre:'Deloitte Argentina',          url:'https://www2.deloitte.com/ar/es/pages/careers/topics/careers.html',    categoria:'Consultoría',                provincia:'Nacional' },
  { id:'dell',             nombre:'Dell Argentina',              url:'https://jobs.dell.com/',                                               categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'despegar',         nombre:'Despegar',                    url:'https://careers.despegar.com/',                                        categoria:'Turismo / Tecnología',       provincia:'Nacional' },
  { id:'dhl',              nombre:'DHL Argentina',               url:'https://www.dhl.com/ar-es/home/careers.html',                          categoria:'Logística',                  provincia:'Nacional' },
  { id:'directv',          nombre:'DirecTV Argentina',           url:'https://careers.directv.com/',                                         categoria:'Telecomunicaciones',         provincia:'Nacional' },
  { id:'ericsson',         nombre:'Ericsson Argentina',          url:'https://jobs.ericsson.com/',                                           categoria:'Telecomunicaciones',         provincia:'Nacional' },
  { id:'ey',               nombre:'EY Argentina',                url:'https://www.ey.com/es_ar/careers',                                     categoria:'Consultoría',                provincia:'Nacional' },
  { id:'fedex',            nombre:'FedEx Argentina',             url:'https://careers.fedex.com/',                                           categoria:'Logística',                  provincia:'Nacional' },
  { id:'flybondi',         nombre:'Flybondi',                    url:'https://www.flybondi.com/ar/trabaja-con-nosotros',                     categoria:'Aviación',                   provincia:'Nacional' },
  { id:'ge',               nombre:'GE Argentina',                url:'https://jobs.gecareers.com/',                                          categoria:'Industria',                  provincia:'Nacional' },
  { id:'globant',          nombre:'Globant',                     url:'https://www.globant.com/careers/',                                     categoria:'IT / Tecnología',            provincia:'Nacional' },
  { id:'google',           nombre:'Google Argentina',            url:'https://careers.google.com/',                                          categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'hcl',              nombre:'HCL Argentina',               url:'https://www.hcltech.com/careers',                                      categoria:'IT',                         provincia:'Nacional' },
  { id:'honeywell',        nombre:'Honeywell Argentina',         url:'https://careers.honeywell.com/',                                       categoria:'Industria / Tecnología',     provincia:'Nacional' },
  { id:'hp',               nombre:'HP Argentina',                url:'https://jobs.hp.com/',                                                 categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'ibm',              nombre:'IBM Argentina',               url:'https://www.ibm.com/ar-es/employment/',                                categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'infosys',          nombre:'Infosys Argentina',           url:'https://www.infosys.com/careers/',                                     categoria:'IT',                         provincia:'Nacional' },
  { id:'intel',            nombre:'Intel Argentina',             url:'https://jobs.intel.com/',                                              categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'jnj',              nombre:'Johnson & Johnson',           url:'https://jobs.jnj.com/',                                                categoria:'Farmacéutica',               provincia:'Nacional' },
  { id:'jpmorgan',         nombre:'JPMorgan Argentina',          url:'https://careers.jpmorgan.com/',                                        categoria:'Banca',                      provincia:'Nacional' },
  { id:'kpmg',             nombre:'KPMG Argentina',              url:'https://home.kpmg/ar/es/home/careers.html',                            categoria:'Consultoría',                provincia:'Nacional' },
  { id:'latam',            nombre:'LATAM Airlines Argentina',    url:'https://careers.latam.com/',                                           categoria:'Aviación',                   provincia:'Nacional' },
  { id:'lenovo',           nombre:'Lenovo Argentina',            url:'https://jobs.lenovo.com/',                                             categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'mastercard',       nombre:'Mastercard Argentina',        url:'https://careers.mastercard.com/',                                      categoria:'Fintech / Pagos',            provincia:'Nacional' },
  { id:'mckinsey',         nombre:'McKinsey Argentina',          url:'https://www.mckinsey.com/careers',                                     categoria:'Consultoría',                provincia:'Nacional' },
  { id:'mercadolibre',     nombre:'Mercado Libre',               url:'https://jobs.mercadolibre.com/',                                       categoria:'E-commerce / Tecnología',    provincia:'Nacional' },
  { id:'mercadopago',      nombre:'Mercado Pago',                url:'https://jobs.mercadolibre.com/',                                       categoria:'Fintech',                    provincia:'Nacional' },
  { id:'microsoft',        nombre:'Microsoft Argentina',         url:'https://careers.microsoft.com/',                                       categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'motorola',         nombre:'Motorola Solutions',          url:'https://motorolasolutions.com/careers',                                categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'naranjax',         nombre:'Naranja X',                   url:'https://naranjax.com/trabaja-con-nosotros',                            categoria:'Fintech',                    provincia:'Nacional' },
  { id:'netflix',          nombre:'Netflix',                     url:'https://jobs.netflix.com/',                                            categoria:'Tecnología / Medios',        provincia:'Nacional' },
  { id:'nokia',            nombre:'Nokia Argentina',             url:'https://careers.nokia.com/',                                           categoria:'Telecomunicaciones',         provincia:'Nacional' },
  { id:'novartis',         nombre:'Novartis Argentina',          url:'https://www.novartis.com/careers',                                     categoria:'Farmacéutica',               provincia:'Nacional' },
  { id:'nuvei',            nombre:'Nuvei',                       url:'https://www.nuvei.com/careers',                                        categoria:'Fintech',                    provincia:'Nacional' },
  { id:'oracle',           nombre:'Oracle Argentina',            url:'https://www.oracle.com/careers/',                                      categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'pfizer',           nombre:'Pfizer Argentina',            url:'https://www.pfizer.com/careers',                                       categoria:'Farmacéutica',               provincia:'Nacional' },
  { id:'pwc',              nombre:'PwC Argentina',               url:'https://www.pwc.com.ar/es/careers.html',                               categoria:'Consultoría',                provincia:'Nacional' },
  { id:'rappi',            nombre:'Rappi Argentina',             url:'https://about.rappi.com/es/careers',                                   categoria:'Delivery / Tecnología',      provincia:'Nacional' },
  { id:'ripio',            nombre:'Ripio',                       url:'https://ripio.com/careers/',                                           categoria:'Fintech / Cripto',           provincia:'Nacional' },
  { id:'roche',            nombre:'Roche Argentina',             url:'https://www.roche.com/careers',                                        categoria:'Farmacéutica',               provincia:'Nacional' },
  { id:'salesforce',       nombre:'Salesforce Argentina',        url:'https://www.salesforce.com/company/careers/',                          categoria:'Tecnología / CRM',           provincia:'Nacional' },
  { id:'sap',              nombre:'SAP Argentina',               url:'https://www.sap.com/careers/',                                         categoria:'Tecnología',                 provincia:'Nacional' },
  { id:'tcs',              nombre:'Tata Consultancy Services',   url:'https://www.tcs.com/careers',                                          categoria:'IT / Consultoría',           provincia:'Nacional' },
  { id:'uala',             nombre:'Ualá',                        url:'https://www.uala.com.ar/trabaja-con-nosotros',                         categoria:'Fintech',                    provincia:'Nacional' },
  { id:'ups',              nombre:'UPS Argentina',               url:'https://www.jobs-ups.com/',                                            categoria:'Logística',                  provincia:'Nacional' },
  { id:'visa',             nombre:'Visa Argentina',              url:'https://usa.visa.com/careers.html',                                    categoria:'Fintech / Pagos',            provincia:'Nacional' },
  { id:'western-union',    nombre:'Western Union Argentina',     url:'https://careers.westernunion.com/',                                    categoria:'Finanzas / Pagos',           provincia:'Nacional' },
  { id:'wipro',            nombre:'Wipro Argentina',             url:'https://careers.wipro.com/',                                           categoria:'IT',                         provincia:'Nacional' },
  { id:'adecco',           nombre:'Adecco Argentina',            url:'https://adecco.com.ar',                                                categoria:'RRHH / Fábricas',            provincia:'Nacional' },
  { id:'randstad',         nombre:'Randstad Argentina',          url:'https://randstad.com.ar',                                              categoria:'RRHH / Logística',           provincia:'Nacional' },
  { id:'manpower',         nombre:'ManpowerGroup Argentina',     url:'https://manpowergroup.com.ar',                                         categoria:'RRHH',                       provincia:'Nacional' },
  { id:'bayton',           nombre:'Bayton',                      url:'https://bayton.com',                                                   categoria:'RRHH',                       provincia:'Nacional' },
  { id:'portal-empleo',    nombre:'Portal Empleo Nacional',      url:'https://portalempleo.gob.ar',                                          categoria:'Empleo Público',             provincia:'Nacional' },
  { id:'computrabajo',     nombre:'Computrabajo Argentina',      url:'https://computrabajo.com.ar',                                          categoria:'Portal de Empleo',           provincia:'Nacional' },
  { id:'zonajobs',         nombre:'ZonaJobs',                    url:'https://zonajobs.com.ar',                                              categoria:'Portal de Empleo',           provincia:'Nacional' },
  { id:'linkedin',         nombre:'LinkedIn Argentina',          url:'https://linkedin.com',                                                 categoria:'Portal de Empleo',           provincia:'Nacional' },
  { id:'amia-empleos',     nombre:'AMIA Empleos',                url:'https://amia.org.ar',                                                  categoria:'Portal de Empleo',           provincia:'Nacional' },
  { id:'uia',              nombre:'UIA - Unión Industrial',      url:'https://uia.org.ar',                                                   categoria:'Directorio Industrial',      provincia:'Nacional' },

  // ── Buenos Aires ──────────────────────────────────────────────────────────
  { id:'andreani',         nombre:'Andreani',                    url:'https://www.andreani.com/institucional/trabaja-con-nosotros',           categoria:'Logística',                  provincia:'Buenos Aires' },
  { id:'arcor',            nombre:'Arcor',                       url:'https://www.arcor.com.ar/institucional/trabaja-con-nosotros',           categoria:'Alimentos',                  provincia:'Buenos Aires' },
  { id:'banco-ciudad',     nombre:'Banco Ciudad',                url:'https://www.bancociudad.com.ar/institucional/trabaja-con-nosotros',     categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'banco-galicia',    nombre:'Banco Galicia',               url:'https://www.galicia.ar/personas/institucional/trabaja-con-nosotros',    categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'banco-macro',      nombre:'Banco Macro',                 url:'https://www.macro.com.ar/institucional/trabaja-con-nosotros',           categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'banco-nacion',     nombre:'Banco Nación',                url:'https://www.bna.com.ar/institucional/trabajaconnosotros',               categoria:'Banca Pública',              provincia:'Buenos Aires' },
  { id:'banco-patagonia',  nombre:'Banco Patagonia',             url:'https://www.bancopatagonia.com.ar/institucional/trabaja-con-nosotros',  categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'banco-provincia',  nombre:'Banco Provincia',             url:'https://www.bpba.com.ar/institucional/trabaja-con-nosotros',            categoria:'Banca Pública',              provincia:'Buenos Aires' },
  { id:'banco-santander',  nombre:'Banco Santander',             url:'https://www.santander.com.ar/banco/online/institucional/trabaja-con-nosotros', categoria:'Banca',             provincia:'Buenos Aires' },
  { id:'banco-supervielle',nombre:'Banco Supervielle',           url:'https://www.supervielle.com.ar/institucional/trabaja-con-nosotros',     categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'bbva',             nombre:'BBVA Argentina',              url:'https://www.bbva.com.ar/general/trabaja-con-nosotros.html',             categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'brubank',          nombre:'Brubank',                     url:'https://www.brubank.com.ar/trabaja-con-nosotros',                       categoria:'Fintech',                    provincia:'Buenos Aires' },
  { id:'bridgestone',      nombre:'Bridgestone Argentina',       url:'https://bridgestone.com.ar',                                           categoria:'Fábrica / Neumáticos',       provincia:'Buenos Aires' },
  { id:'carrefour',        nombre:'Carrefour Argentina',         url:'https://www.carrefour.com.ar/institucional/trabaja-con-nosotros',       categoria:'Retail',                     provincia:'Buenos Aires' },
  { id:'cencosud',         nombre:'Cencosud',                    url:'https://www.cencosud.com/trabaja-con-nosotros/',                        categoria:'Retail',                     provincia:'Buenos Aires' },
  { id:'claro',            nombre:'Claro Argentina',             url:'https://www.claro.com.ar/personas/institucional/trabaja-con-nosotros/', categoria:'Telecomunicaciones',         provincia:'Buenos Aires' },
  { id:'correo-arg',       nombre:'Correo Argentino',            url:'https://www.correoargentino.com.ar/institucional/trabaja-con-nosotros', categoria:'Correo / Logística',         provincia:'Buenos Aires' },
  { id:'coto',             nombre:'Coto',                        url:'https://www.coto.com.ar/institucional/trabaja-con-nosotros',            categoria:'Supermercado',               provincia:'Buenos Aires' },
  { id:'danone-ba',        nombre:'Danone Argentina',            url:'https://danone.com.ar',                                                 categoria:'Alimenticia / Fábrica',      provincia:'Buenos Aires' },
  { id:'falabella',        nombre:'Falabella Argentina',         url:'https://www.falabella.com.ar/falabella-ar/page/trabaja-con-nosotros',   categoria:'Retail',                     provincia:'Buenos Aires' },
  { id:'farmacity',        nombre:'Farmacity',                   url:'https://www.farmacity.com/institucional/trabaja-con-nosotros',          categoria:'Salud / Retail',             provincia:'Buenos Aires' },
  { id:'fate',             nombre:'Fate (Neumáticos)',           url:'https://fate.com.ar',                                                   categoria:'Fábrica / Neumáticos',       provincia:'Buenos Aires' },
  { id:'fiat-ba',          nombre:'Fiat Argentina',              url:'https://www.fiat.com.ar/institucional/trabaja-con-nosotros',            categoria:'Automotriz',                 provincia:'Buenos Aires' },
  { id:'ford',             nombre:'Ford Argentina',              url:'https://www.ford.com.ar/institucional/trabaja-con-nosotros',            categoria:'Automotriz / Fábrica',       provincia:'Buenos Aires' },
  { id:'fravega',          nombre:'Frávega',                     url:'https://www.fravega.com/institucional/trabaja-con-nosotros/',           categoria:'Retail / Electrónica',       provincia:'Buenos Aires' },
  { id:'garbarino',        nombre:'Garbarino',                   url:'https://www.garbarino.com/institucional/trabaja-con-nosotros',          categoria:'Retail / Electrónica',       provincia:'Buenos Aires' },
  { id:'gm-ba',            nombre:'General Motors Argentina',    url:'https://careers.gm.com/',                                              categoria:'Automotriz',                 provincia:'Buenos Aires' },
  { id:'honda-ba',         nombre:'Honda Argentina',             url:'https://www.honda.com.ar/institucional/trabaja-con-nosotros',           categoria:'Automotriz / Fábrica',       provincia:'Buenos Aires' },
  { id:'hsbc',             nombre:'HSBC Argentina',              url:'https://www.hsbc.com.ar/1/2/home/trabaja-con-nosotros',                 categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'icbc',             nombre:'ICBC Argentina',              url:'https://www.icbc.com.ar/institucional/trabaja-con-nosotros',            categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'invap',            nombre:'INVAP',                       url:'https://www.invap.com.ar/institucional/trabaja-con-nosotros',           categoria:'Tecnología / Estado',        provincia:'Buenos Aires' },
  { id:'itau',             nombre:'Itaú Argentina',              url:'https://www.itau.com.ar/institucional/trabaja-con-nosotros',            categoria:'Banca',                      provincia:'Buenos Aires' },
  { id:'kimberly',         nombre:'Kimberly-Clark',              url:'https://kimberly-clark.com',                                           categoria:'Fábrica / Higiene',          provincia:'Buenos Aires' },
  { id:'la-anonima',       nombre:'La Anónima',                  url:'https://www.la-anonima.com.ar/institucional/trabaja-con-nosotros',      categoria:'Supermercado',               provincia:'Buenos Aires' },
  { id:'lear',             nombre:'Lear Corporation',            url:'https://lear.com',                                                      categoria:'Autopartista / Fábrica',     provincia:'Buenos Aires' },
  { id:'lemon',            nombre:'Lemon Cash',                  url:'https://www.lemon.me/trabaja-con-nosotros',                            categoria:'Fintech / Cripto',           provincia:'Buenos Aires' },
  { id:'loma-negra',       nombre:'Loma Negra',                  url:'https://www.lomanegra.com.ar/trabaja-con-nosotros/',                   categoria:'Construcción / Industria',   provincia:'Buenos Aires' },
  { id:'mastellone',       nombre:'Mastellone (La Serenísima)',  url:'https://www.mastellone.com.ar/institucional/trabaja-con-nosotros',      categoria:'Alimentos / Lácteos',        provincia:'Buenos Aires' },
  { id:'molinos',          nombre:'Molinos Río de la Plata',     url:'https://www.molinos.com.ar/institucional/trabaja-con-nosotros',         categoria:'Alimentos',                  provincia:'Buenos Aires' },
  { id:'mondelez',         nombre:'Mondelez International',      url:'https://mondelezinternational.com',                                    categoria:'Alimentos / Fábrica',        provincia:'Buenos Aires' },
  { id:'movistar',         nombre:'Movistar Argentina',          url:'https://www.movistar.com.ar/institucional/trabaja-con-nosotros',        categoria:'Telecomunicaciones',         provincia:'Buenos Aires' },
  { id:'musimundo',        nombre:'Musimundo',                   url:'https://musimundo.com',                                                 categoria:'Retail / Logística',         provincia:'Buenos Aires' },
  { id:'nestle-ba',        nombre:'Nestlé Argentina',            url:'https://www.nestle.com.ar/careers',                                    categoria:'Alimentos / Fábrica',        provincia:'Buenos Aires' },
  { id:'newsan',           nombre:'Newsan',                      url:'https://newsan.com.ar',                                                 categoria:'Logística / Depósitos',      provincia:'Buenos Aires' },
  { id:'oca',              nombre:'OCA',                         url:'https://www.oca.com.ar/institucional/trabaja-con-nosotros',             categoria:'Logística',                  provincia:'Buenos Aires' },
  { id:'ocasa',            nombre:'OCASA',                       url:'https://ocasa.com',                                                     categoria:'Logística / Salud',          provincia:'Buenos Aires' },
  { id:'pae',              nombre:'Pan American Energy',         url:'https://www.panamericanenergy.com/es/carreras',                         categoria:'Energía / Oil & Gas',        provincia:'Buenos Aires' },
  { id:'pepsico-ba',       nombre:'PepsiCo Argentina',           url:'https://www.pepsicojobs.com/',                                         categoria:'Alimentos / Bebidas',        provincia:'Buenos Aires' },
  { id:'personal',         nombre:'Personal (Telecom)',          url:'https://www.personal.com.ar/institucional/trabaja-con-nosotros',        categoria:'Telecomunicaciones',         provincia:'Buenos Aires' },
  { id:'pg',               nombre:'Procter & Gamble',            url:'https://www.pgcareers.com/',                                           categoria:'Consumo Masivo',             provincia:'Buenos Aires' },
  { id:'pirelli',          nombre:'Pirelli Neumáticos',          url:'https://pirelli.com',                                                   categoria:'Fábrica / Neumáticos',       provincia:'Buenos Aires' },
  { id:'plaza-logistica',  nombre:'Plaza Logística',             url:'https://plazalogistica.com.ar',                                        categoria:'Logística / Depósitos',      provincia:'Buenos Aires' },
  { id:'prisma',           nombre:'Prisma Medios de Pago',       url:'https://www.prismamediosdepago.com/institucional/trabaja-con-nosotros', categoria:'Fintech / Pagos',            provincia:'Buenos Aires' },
  { id:'prosegur',         nombre:'Prosegur Argentina',          url:'https://www.prosegur.com.ar/trabaja-con-nosotros',                     categoria:'Seguridad',                  provincia:'Buenos Aires' },
  { id:'quilmes-ba',       nombre:'Quilmes (AB InBev)',          url:'https://www.ab-inbev.com/careers/',                                    categoria:'Bebidas / Industria',        provincia:'Buenos Aires' },
  { id:'raizen',           nombre:'Raízen Argentina (Shell)',     url:'https://raizen.com.ar',                                                categoria:'Energía / Refinería',        provincia:'Buenos Aires' },
  { id:'renault-ba',       nombre:'Renault Argentina',           url:'https://www.renault.com.ar/institucional/trabaja-con-nosotros',        categoria:'Automotriz',                 provincia:'Buenos Aires' },
  { id:'sancor-ba',        nombre:'Sancor',                      url:'https://www.sancor.com/institucional/trabaja-con-nosotros',            categoria:'Alimentos / Lácteos',        provincia:'Buenos Aires' },
  { id:'securitas',        nombre:'Securitas Argentina',         url:'https://www.securitas.com.ar/trabaja-con-nosotros/',                   categoria:'Seguridad',                  provincia:'Buenos Aires' },
  { id:'siemens',          nombre:'Siemens Argentina',           url:'https://jobs.siemens.com/',                                            categoria:'Industria / Energía',        provincia:'Buenos Aires' },
  { id:'sodimac',          nombre:'Sodimac Argentina',           url:'https://www.sodimac.com.ar/sodimac-ar/category/cat10001/trabaja-con-nosotros', categoria:'Retail / Construcción', provincia:'Buenos Aires' },
  { id:'techint',          nombre:'Techint',                     url:'https://www.techint.com/careers/',                                     categoria:'Ingeniería / Industria',     provincia:'Buenos Aires' },
  { id:'telecom',          nombre:'Telecom Argentina',           url:'https://www.telecom.com.ar/empleos',                                   categoria:'Telecomunicaciones',         provincia:'Buenos Aires' },
  { id:'tenaris',          nombre:'Tenaris',                     url:'https://www.tenaris.com/es/careers/',                                  categoria:'Industria / Acero',          provincia:'Buenos Aires' },
  { id:'ternium',          nombre:'Ternium Argentina',           url:'https://www.ternium.com/es/careers/',                                  categoria:'Industria / Acero',          provincia:'Buenos Aires' },
  { id:'toyota-ba',        nombre:'Toyota Argentina',            url:'https://www.toyota.com.ar/institucional/trabaja-con-nosotros',         categoria:'Automotriz / Fábrica',       provincia:'Buenos Aires' },
  { id:'unilever-ba',      nombre:'Unilever Argentina',          url:'https://www.unilever.com.ar/careers/',                                 categoria:'Consumo Masivo',             provincia:'Buenos Aires' },
  { id:'vw',               nombre:'Volkswagen Argentina',        url:'https://www.vw.com.ar/institucional/trabaja-con-nosotros',             categoria:'Automotriz / Fábrica',       provincia:'Buenos Aires' },
  { id:'walmart',          nombre:'Walmart Argentina',           url:'https://careers.walmart.com/',                                         categoria:'Retail',                     provincia:'Buenos Aires' },
  { id:'ypf',              nombre:'YPF',                         url:'https://www.ypf.com/EnergiaYPF/Pages/trabaja-con-nosotros.aspx',       categoria:'Energía / Oil & Gas',        provincia:'Buenos Aires' },
  { id:'zonaprop',         nombre:'ZonaProp',                    url:'https://www.zonaprop.com.ar/institucional/trabaja-con-nosotros',        categoria:'Inmobiliaria / Tecnología',  provincia:'Buenos Aires' },
  { id:'axion',            nombre:'Axion Energy',                url:'https://axionenergy.com',                                              categoria:'Energía / Refinería',        provincia:'Buenos Aires' },
  { id:'aluar',            nombre:'Aluar',                       url:'https://aluar.com.ar',                                                  categoria:'Aluminio / Industria',       provincia:'Buenos Aires' },
  { id:'acindar',          nombre:'Acindar (ArcelorMittal)',     url:'https://arcelormittal.com',                                            categoria:'Siderurgia',                 provincia:'Buenos Aires' },
  { id:'basf',             nombre:'BASF Argentina',              url:'https://basf.com',                                                      categoria:'Química / Fábrica',          provincia:'Buenos Aires' },
  { id:'dow-ba',           nombre:'Dow Argentina',               url:'https://dow.com',                                                       categoria:'Química / Fábrica',          provincia:'Buenos Aires' },
  { id:'schenker',         nombre:'Schenker Argentina',          url:'https://dbschenker.com',                                               categoria:'Logística Internacional',    provincia:'Buenos Aires' },
  { id:'kuehne',           nombre:'Kuehne+Nagel',                url:'https://kuehne-nagel.com',                                             categoria:'Logística',                  provincia:'Buenos Aires' },
  { id:'maersk',           nombre:'Maersk Argentina',            url:'https://maersk.com',                                                   categoria:'Logística / Marítimo',       provincia:'Buenos Aires' },
  { id:'smurfit',          nombre:'Smurfit Kappa',               url:'https://smurfitkappa.com',                                             categoria:'Packaging / Fábrica',        provincia:'Buenos Aires' },
  { id:'tetra-pak',        nombre:'Tetra Pak Argentina',         url:'https://tetrapak.com',                                                 categoria:'Packaging',                  provincia:'Buenos Aires' },
  { id:'gestamp-ba',       nombre:'Gestamp',                     url:'https://gestamp.com',                                                   categoria:'Autopartista / Fábrica',     provincia:'Buenos Aires' },
  { id:'bosch-ba',         nombre:'Bosch Argentina',             url:'https://bosch.com.ar',                                                  categoria:'Industrial / Servicios',     provincia:'Buenos Aires' },
  { id:'scania-ba',        nombre:'Scania Argentina',            url:'https://scania.com',                                                   categoria:'Logística y Servicios',      provincia:'Buenos Aires' },
  { id:'air-liquide',      nombre:'Air Liquide Argentina',       url:'https://airliquide.com',                                               categoria:'Gases Industriales',         provincia:'Buenos Aires' },
  { id:'chazki',           nombre:'Chazki',                      url:'https://chazki.com',                                                   categoria:'Logística E-commerce',       provincia:'Buenos Aires' },
  { id:'zippin',           nombre:'Zippin',                      url:'https://zippin.com.ar',                                                 categoria:'Logística / Tech',           provincia:'Buenos Aires' },
  { id:'shipnow',          nombre:'Shipnow',                     url:'https://shipnow.com.ar',                                               categoria:'Logística / Depósito',       provincia:'Buenos Aires' },
  { id:'alpargatas',       nombre:'Alpargatas Argentina',        url:'https://alpargatas.com.ar',                                            categoria:'Textil / Fábrica',           provincia:'Buenos Aires' },
  { id:'grimoldi',         nombre:'Grimoldi',                    url:'https://grimoldi.com',                                                  categoria:'Calzado / Fábrica',          provincia:'Buenos Aires' },
  { id:'lab-bago',         nombre:'Laboratorios Bagó',           url:'https://bago.com.ar',                                                   categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'roemmers',         nombre:'Roemmers',                    url:'https://roemmers.com.ar',                                              categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'elea',             nombre:'Laboratorios Elea',           url:'https://elea.com',                                                      categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'gador',            nombre:'Laboratorio Gador',           url:'https://gador.com.ar',                                                  categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'sanofi',           nombre:'Sanofi Argentina',            url:'https://sanofi.com.ar',                                                 categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'abbott',           nombre:'Abbott Argentina',            url:'https://abbott.com.ar',                                                 categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'boehringer',       nombre:'Boehringer Ingelheim',        url:'https://boehringer-ingelheim.com.ar',                                   categoria:'Farmacéutica',               provincia:'Buenos Aires' },
  { id:'cepip',            nombre:'Parque Industrial Pilar',     url:'https://cepip.org.ar',                                                  categoria:'Directorio Industrial',      provincia:'Buenos Aires' },

  // ── Córdoba ───────────────────────────────────────────────────────────────
  { id:'arcor-cba',        nombre:'Arcor (Plantas Córdoba)',     url:'https://arcor.com',                                                     categoria:'Alimentos / Fábrica',        provincia:'Córdoba' },
  { id:'stellantis',       nombre:'Stellantis / Fiat (Ferreyra)',url:'https://stellantis.com',                                               categoria:'Automotriz / Fábrica',       provincia:'Córdoba' },
  { id:'renault-cba',      nombre:'Renault (Santa Isabel)',      url:'https://renault.com.ar',                                               categoria:'Automotriz / Fábrica',       provincia:'Córdoba' },
  { id:'iveco',            nombre:'Iveco Argentina',             url:'https://iveco.com',                                                     categoria:'Camiones / Fábrica',         provincia:'Córdoba' },
  { id:'nissan',           nombre:'Nissan Argentina',            url:'https://nissan.com.ar',                                                 categoria:'Automotriz / Fábrica',       provincia:'Córdoba' },
  { id:'agd',              nombre:'Aceitera General Deheza',     url:'https://agd.com.ar',                                                    categoria:'Agro / Industria',           provincia:'Córdoba' },
  { id:'holcim-cba',       nombre:'Holcim (Malagueño)',          url:'https://holcim.com.ar',                                                 categoria:'Cemento / Fábrica',          provincia:'Córdoba' },
  { id:'vw-cba',           nombre:'Volkswagen (Transmisiones)',  url:'https://volkswagen.com.ar',                                            categoria:'Automotriz / Fábrica',       provincia:'Córdoba' },
  { id:'grido',            nombre:'Helacor S.A. (Grido)',        url:'https://gridohelado.com',                                              categoria:'Alimentos / Fábrica',        provincia:'Córdoba' },
  { id:'manfrey',          nombre:'Manfrey (Lácteos)',           url:'https://manfrey.com.ar',                                               categoria:'Lácteos / Fábrica',          provincia:'Córdoba' },
  { id:'promedon',         nombre:'Promedon',                    url:'https://promedon.com',                                                  categoria:'Médica / Fábrica',           provincia:'Córdoba' },
  { id:'metalfor-cba',     nombre:'Metalfor (Maquinaria)',       url:'https://metalfor.com.ar',                                              categoria:'Maquinaria Agrícola',        provincia:'Córdoba' },
  { id:'pauny',            nombre:'Pauny (Las Varillas)',        url:'https://pauny.com.ar',                                                  categoria:'Maquinaria Pesada',          provincia:'Córdoba' },
  { id:'agrometal',        nombre:'Agrometal',                   url:'https://agrometal.com',                                                 categoria:'Maquinaria Agrícola',        provincia:'Córdoba' },
  { id:'mainero-cba',      nombre:'Mainero (Maquinaria)',        url:'https://mainero.com.ar',                                               categoria:'Maquinaria Agrícola',        provincia:'Córdoba' },
  { id:'lear-cba',         nombre:'Lear Corporation (SF/CBA)',   url:'https://lear.com',                                                      categoria:'Autopartista / Fábrica',     provincia:'Córdoba' },
  { id:'scania-cba',       nombre:'Scania Argentina (CBA)',      url:'https://scania.com',                                                   categoria:'Fábrica / Logística',        provincia:'Córdoba' },
  { id:'zf-cba',           nombre:'ZF Argentina (San Francisco)',url:'https://zf.com',                                                       categoria:'Autopartista / Fábrica',     provincia:'Córdoba' },
  { id:'bio4',             nombre:'Bio4 (Bioetanol Río Cuarto)', url:'https://bio4.com.ar',                                                   categoria:'Energía / Fábrica',          provincia:'Córdoba' },
  { id:'andreani-cba',     nombre:'Andreani (Córdoba)',          url:'https://andreani.com',                                                  categoria:'Logística',                  provincia:'Córdoba' },
  { id:'weg',              nombre:'Weg Argentina (Motores)',     url:'https://weg.net',                                                       categoria:'Fábrica / Motores',          provincia:'Córdoba' },

  // ── Santa Fe ──────────────────────────────────────────────────────────────
  { id:'cargill',          nombre:'Cargill Argentina',           url:'https://cargill.com.ar',                                               categoria:'Agro / Logística',           provincia:'Santa Fe' },
  { id:'gm-sf',            nombre:'General Motors (Alvear)',     url:'https://gm.com.ar',                                                     categoria:'Automotriz / Fábrica',       provincia:'Santa Fe' },
  { id:'acindar-sf',       nombre:'Acindar (Villa Constitución)',url:'https://arcelormittal.com',                                            categoria:'Siderurgia',                 provincia:'Santa Fe' },
  { id:'swift',            nombre:'Swift Argentina (Frigorífico)',url:'https://swift.com.ar',                                                categoria:'Alimentos / Frigorífico',    provincia:'Santa Fe' },
  { id:'paladini',         nombre:'Paladini',                    url:'https://paladini.com.ar',                                              categoria:'Alimentos / Fábrica',        provincia:'Santa Fe' },
  { id:'vicentin',         nombre:'Vicentin (Aceitera)',         url:'https://vicentin.com.ar',                                              categoria:'Agro / Fábrica',             provincia:'Santa Fe' },
  { id:'bunge',            nombre:'Bunge Argentina',             url:'https://bungeargentina.com',                                           categoria:'Agro / Fábrica',             provincia:'Santa Fe' },
  { id:'dreyfus',          nombre:'Louis Dreyfus (LDC)',         url:'https://ldc.com',                                                       categoria:'Agro / Logística',           provincia:'Santa Fe' },
  { id:'renova',           nombre:'Renova (Biocombustibles)',    url:'https://renova.com.ar',                                                 categoria:'Energía / Fábrica',          provincia:'Santa Fe' },
  { id:'terminal6',        nombre:'Terminal 6 (Puerto)',         url:'https://t6.com.ar',                                                     categoria:'Puerto / Logística',         provincia:'Santa Fe' },
  { id:'celulosa',         nombre:'Celulosa Argentina',          url:'https://celulosaargentina.com.ar',                                     categoria:'Papel / Fábrica',            provincia:'Santa Fe' },
  { id:'dow-sf',           nombre:'Dow Argentina (San Lorenzo)', url:'https://dow.com',                                                       categoria:'Química / Fábrica',          provincia:'Santa Fe' },
  { id:'gerdau',           nombre:'Gerdau Argentina',            url:'https://gerdau.com',                                                   categoria:'Siderurgia',                 provincia:'Santa Fe' },
  { id:'crucianelli',      nombre:'Crucianelli (Armstrong)',     url:'https://crucianelli.com',                                              categoria:'Maquinaria Agrícola',        provincia:'Santa Fe' },
  { id:'vassalli',         nombre:'Vassalli Fabril (Cosechadoras)',url:'https://vassallifabril.com.ar',                                      categoria:'Maquinaria Agrícola',        provincia:'Santa Fe' },
  { id:'milkaut',          nombre:'Milkaut (Lácteos)',           url:'https://milkaut.com.ar',                                               categoria:'Lácteos / Fábrica',          provincia:'Santa Fe' },
  { id:'sancor',           nombre:'Sancor CUL',                  url:'https://sancor.com',                                                   categoria:'Lácteos / Fábrica',          provincia:'Santa Fe' },
  { id:'unilever-sf',      nombre:'Unilever (Gdor. Gálvez)',     url:'https://unilever.com.ar',                                              categoria:'Consumo Masivo / Fábrica',   provincia:'Santa Fe' },
  { id:'nestle-sf',        nombre:'Nestlé Purina (Santo Tomé)',  url:'https://nestle.com.ar',                                                categoria:'Alimentos / Fábrica',        provincia:'Santa Fe' },
  { id:'la-virginia',      nombre:'La Virginia (Rosario)',       url:'https://lavirginia.com.ar',                                            categoria:'Alimentos / Fábrica',        provincia:'Santa Fe' },
  { id:'syngenta-sf',      nombre:'Syngenta (Venado Tuerto)',    url:'https://syngenta.com.ar',                                              categoria:'Agro / Fábrica',             provincia:'Santa Fe' },

  // ── Mendoza ──────────────────────────────────────────────────────────────
  { id:'penaflor',         nombre:'Grupo Peñaflor (Bodegas)',    url:'https://grupopenaflor.com.ar',                                         categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'catena',           nombre:'Bodegas Esmeralda (Catena)',  url:'https://catenazapata.com',                                             categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'fecovita',         nombre:'Fecovita (Cooperativa)',      url:'https://fecovita.com',                                                  categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'chandon',          nombre:'Bodegas Chandon',             url:'https://lvmh.com',                                                      categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'norton',           nombre:'Bodega Norton',               url:'https://norton.com.ar',                                                 categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'zuccardi',         nombre:'Familia Zuccardi',            url:'https://familiazuccardi.com',                                          categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'salentein',        nombre:'Bodegas Salentein',           url:'https://bodegassalentein.com',                                         categoria:'Vitivinícola',               provincia:'Mendoza' },
  { id:'impsa',            nombre:'IMPSA (Metalurgia Pesada)',   url:'https://impsa.com',                                                     categoria:'Metalurgia / Energía',       provincia:'Mendoza' },
  { id:'holcim-mza',       nombre:'Holcim (Planta Capdeville)',  url:'https://holcim.com.ar',                                                 categoria:'Cemento / Fábrica',          provincia:'Mendoza' },
  { id:'danone-mza',       nombre:'Danone (Villavicencio)',      url:'https://danone.com.ar',                                                 categoria:'Agua / Fábrica',             provincia:'Mendoza' },
  { id:'quilmes-mza',      nombre:'Quilmes (Planta Mendoza)',    url:'https://quilmes.com.ar',                                               categoria:'Bebidas / Fábrica',          provincia:'Mendoza' },

  // ── San Juan ──────────────────────────────────────────────────────────────
  { id:'barrick',          nombre:'Barrick Gold (Veladero)',     url:'https://barrick.com',                                                   categoria:'Minería',                    provincia:'San Juan' },
  { id:'glencore',         nombre:'Glencore (Proyecto Pachón)',  url:'https://glencore.com',                                                  categoria:'Minería',                    provincia:'San Juan' },
  { id:'lundin',           nombre:'Lundin Gold (Josemaría)',     url:'https://josemaria.com.ar',                                             categoria:'Minería',                    provincia:'San Juan' },

  // ── San Luis ──────────────────────────────────────────────────────────────
  { id:'arcor-sl',         nombre:'Arcor (Plantas San Luis)',    url:'https://arcor.com',                                                     categoria:'Alimentos / Fábrica',        provincia:'San Luis' },
  { id:'bagley',           nombre:'Bagley Argentina',            url:'https://bagley.com.ar',                                                 categoria:'Alimentos / Fábrica',        provincia:'San Luis' },
  { id:'whirlpool-sl',     nombre:'Whirlpool (San Luis)',        url:'https://whirlpool.com.ar',                                             categoria:'Electrodomésticos / Fábrica', provincia:'San Luis' },
  { id:'mabe-sl',          nombre:'Mabe (San Luis)',             url:'https://mabe.com.ar',                                                   categoria:'Electrodomésticos / Fábrica', provincia:'San Luis' },

  // ── Neuquén / Chubut ──────────────────────────────────────────────────────
  { id:'ypf-nqn',          nombre:'YPF (Vaca Muerta)',           url:'https://ypf.com',                                                       categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'pae-nqn',          nombre:'Pan American Energy (Cerro Dragón)',url:'https://pan-energy.com',                                         categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'tecpetrol',        nombre:'Tecpetrol (Techint)',         url:'https://tecpetrol.com',                                                 categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'pluspetrol',       nombre:'Pluspetrol',                  url:'https://pluspetrol.net',                                               categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'halliburton',      nombre:'Halliburton Argentina',       url:'https://halliburton.com',                                              categoria:'Petróleo / Servicios',       provincia:'Neuquén/Chubut' },
  { id:'slb',              nombre:'SLB (Schlumberger)',          url:'https://slb.com',                                                       categoria:'Petróleo / Servicios',       provincia:'Neuquén/Chubut' },
  { id:'weatherford',      nombre:'Weatherford',                 url:'https://weatherford.com',                                              categoria:'Petróleo / Servicios',       provincia:'Neuquén/Chubut' },
  { id:'chevron',          nombre:'Chevron Argentina',           url:'https://chevron.com',                                                   categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'totalenergies',    nombre:'TotalEnergies Argentina',     url:'https://totalenergies.ar',                                             categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'vista-energy',     nombre:'Vista Energy',                url:'https://vistaenergy.com',                                              categoria:'Petróleo / Gas',             provincia:'Neuquén/Chubut' },
  { id:'tgs',              nombre:'TGS (Gas del Sur)',           url:'https://tgs.com.ar',                                                    categoria:'Gas / Transporte',           provincia:'Neuquén/Chubut' },

  // ── Tucumán / Salta / Jujuy ───────────────────────────────────────────────
  { id:'san-miguel',       nombre:'San Miguel (Limón/Cítricos)', url:'https://sanmiguelglobal.com',                                          categoria:'Alimentos / Fábrica',        provincia:'Tucumán/Salta/Jujuy' },
  { id:'ledesma',          nombre:'Ledesma (Azúcar/Papel)',      url:'https://ledesma.com.ar',                                               categoria:'Azúcar / Papel / Fábrica',   provincia:'Tucumán/Salta/Jujuy' },
  { id:'tabacal',          nombre:'Ingenio El Tabacal (Seaboard)',url:'https://seaboard.com.ar',                                             categoria:'Azúcar / Fábrica',           provincia:'Tucumán/Salta/Jujuy' },
  { id:'livent',           nombre:'Livent (Litio Catamarca)',    url:'https://livent.com',                                                   categoria:'Minería / Litio',            provincia:'Tucumán/Salta/Jujuy' },
  { id:'allkem',           nombre:'Allkem (Litio Jujuy)',        url:'https://allkem.co',                                                     categoria:'Minería / Litio',            provincia:'Tucumán/Salta/Jujuy' },
  { id:'eramine',          nombre:'Eramine Sudamérica (Litio)',  url:'https://eramine.com',                                                  categoria:'Minería / Litio',            provincia:'Tucumán/Salta/Jujuy' },
  { id:'scania-tuc',       nombre:'Scania Argentina (Tucumán)',  url:'https://scania.com',                                                   categoria:'Fábrica / Logística',        provincia:'Tucumán/Salta/Jujuy' },

  // ── Entre Ríos / Misiones ─────────────────────────────────────────────────
  { id:'gta',              nombre:'Granja Tres Arroyos',         url:'https://gta.com.ar',                                                    categoria:'Avícola / Fábrica',          provincia:'Entre Ríos/Misiones' },
  { id:'arauco',           nombre:'Arauco Argentina (Forestal)', url:'https://arauco.com',                                                    categoria:'Forestal / Fábrica',         provincia:'Entre Ríos/Misiones' },
  { id:'las-marias',       nombre:'Las Marías (Taragüí)',        url:'https://lasmarias.com.ar',                                             categoria:'Yerba / Fábrica',            provincia:'Entre Ríos/Misiones' },
  { id:'rosamonte',        nombre:'Rosamonte',                   url:'https://rosamonte.com.ar',                                             categoria:'Yerba / Fábrica',            provincia:'Entre Ríos/Misiones' },

  // ── Tierra del Fuego ─────────────────────────────────────────────────────
  { id:'newsan-tdf',       nombre:'Newsan (Ushuaia)',             url:'https://newsan.com.ar',                                                categoria:'Electrónica / Ensamble',     provincia:'Tierra del Fuego' },
  { id:'mirgor',           nombre:'Mirgor (Río Grande)',         url:'https://mirgor.com.ar',                                                categoria:'Electrónica / Ensamble',     provincia:'Tierra del Fuego' },
  { id:'bgh-tdf',          nombre:'BGH (Río Grande)',            url:'https://bgh.com.ar',                                                    categoria:'Electrónica / Ensamble',     provincia:'Tierra del Fuego' },
  { id:'solnik',           nombre:'Solnik S.A. (Nokia/Xiaomi)',  url:'https://solnik.com.ar',                                                categoria:'Electrónica / Ensamble',     provincia:'Tierra del Fuego' },
  { id:'brightstar',       nombre:'Brightstar Argentina',        url:'https://brightstar.com',                                               categoria:'Electrónica / Ensamble',     provincia:'Tierra del Fuego' },
];

function getInicial(nombre: string): string {
  return nombre?.trim()?.[0]?.toUpperCase() || '?';
}

export default function Companies() {
  const [letraActiva,    setLetraActiva]    = useState('A');
  const [busqueda,       setBusqueda]       = useState('');
  const [provinciaActiva, setProvinciaActiva] = useState<string>('Todas');
  const [isMenuOpen,     setIsMenuOpen]     = useState(false);

  const modoBusqueda = busqueda.trim().length > 0;

  const empresasMostradas = EMPRESAS.filter((e) => {
    const coincideProv   = provinciaActiva === 'Todas' || e.provincia === provinciaActiva;
    if (modoBusqueda) {
      return coincideProv && (
        e.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()) ||
        e.categoria.toLowerCase().includes(busqueda.toLowerCase().trim())
      );
    }
    return coincideProv && getInicial(e.nombre) === letraActiva;
  });

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
            placeholder="Buscar empresa o rubro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 dark:text-white"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="text-gray-400 text-xs font-bold px-1">✕</button>
          )}
        </div>
      </div>

      {/* Filtro provincias */}
      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {PROVINCIAS.map((p) => (
            <button
              key={p}
              onClick={() => { setProvinciaActiva(p); setBusqueda(''); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${
                provinciaActiva === p
                  ? 'bg-[--sc-600] text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de letra */}
      {!modoBusqueda && (
        <div className="px-4 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {LETRAS.map((l) => (
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
      <div className="px-4 pt-4 space-y-3">
        {empresasMostradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              {modoBusqueda
                ? `Sin resultados para "${busqueda}"`
                : `No hay empresas con la letra ${letraActiva} en ${provinciaActiva}`
              }
            </p>
          </div>
        )}

        {empresasMostradas.map((empresa) => (
          <div
            key={empresa.id}
            className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-[--sc-100] dark:bg-[--sc-700]/20 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-[--sc-700] dark:text-[--sc-100] font-black text-lg">{getInicial(empresa.nombre)}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{empresa.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{empresa.categoria}</p>
                <p className="text-[10px] text-[--sc-500] font-bold">{empresa.provincia}</p>
              </div>
            </div>
            <a
              href={empresa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 active:scale-95 transition-transform shrink-0"
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
