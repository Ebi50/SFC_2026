import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { userApi } from '../services/api';

export const TeilnahmeerklaerungView: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      userApi.getProfile().then(data => {
        if (data.waiverAccepted) {
          setAlreadyAccepted(true);
        }
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white p-8 pb-6">
          <h1 className="text-3xl font-display font-bold mb-1">Teilnahmeerklaerung & Haftungsverzicht</h1>
          <p className="text-white/90">SkinfitCup &ndash; Vereinstraining des RSV Stuttgart-Vaihingen</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Hinweis */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <p className="text-gray-800 text-sm">
              <strong>Hinweis:</strong> Diese Erklaerung muss nur <strong>einmalig bei der Registrierung</strong> abgegeben werden und gilt fuer alle zukuenftigen Teilnahmen am SkinfitCup.
            </p>
          </div>

          {/* 1. Charakter */}
          <section>
            <h2 className="text-xl font-display font-bold text-primary border-b-2 border-red-100 pb-2 mb-3">1. Charakter der Veranstaltung</h2>

            <div className="bg-red-50 border-l-4 border-primary p-4 rounded-r-lg mb-4">
              <p className="text-gray-800">
                <strong>Wichtiger Hinweis:</strong> Beim SkinfitCup handelt es sich <strong>nicht</strong> um eine Rennveranstaltung, sondern ausschliesslich um ein <strong>Vereinstraining des RSV Stuttgart-Vaihingen e.&thinsp;V.</strong>
              </p>
            </div>

            <p className="text-gray-600 mb-2">
              Die Ausfahrt findet im Rahmen der regulaeren Trainingsaktivitaeten des{' '}
              <a href="https://rsv-vaihingen.de/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                RSV Stuttgart-Vaihingen e.&thinsp;V.
              </a>{' '}
              statt. Es handelt sich um kein Rennen und keine genehmigte Rennveranstaltung im Sinne der Strassenverkehrsordnung. Es gelten die Strassenverkehrsordnung (StVO) sowie alle anwendbaren Verkehrsregeln uneingeschraenkt.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 2. Bedingungen */}
          <section>
            <h2 className="text-xl font-display font-bold text-primary border-b-2 border-red-100 pb-2 mb-3">2. Haftungsverzicht, Eigenverantwortung & Bedingungen</h2>

            <p className="text-gray-600 mb-3">Mit der Bestaetigung dieser Teilnahmeerklaerung erkenne ich Folgendes an:</p>

            <h3 className="font-bold text-gray-800 mt-4 mb-1">Teilnahme auf eigenes Risiko</h3>
            <p className="text-gray-600 mb-3">
              Mir ist bekannt, dass ich an dem Vereinstraining (SkinfitCup) <strong>grundsaetzlich auf eigene Gefahr und eigenes Risiko</strong> teilnehme. Ich bin mir bewusst, dass der Radsport und die Teilnahme an Gruppenausfahrten mit erhoehten Gefahren verbunden sind, die zu Sach- und Personenschaeden fuehren koennen.
            </p>

            <h3 className="font-bold text-gray-800 mt-4 mb-1">Verzicht auf Regressansprueche</h3>
            <p className="text-gray-600 mb-2">
              Soweit gesetzlich zulaessig, verzichte ich auf <strong>saemtliche Haftungs- und Regressansprueche</strong> gegenueber:
            </p>
            <ul className="list-disc ml-6 text-gray-600 mb-3 space-y-1">
              <li>dem Organisator und Betreiber der SkinfitCup-Website (Eberhard Janzen),</li>
              <li>dem RSV Stuttgart-Vaihingen e.&thinsp;V. und dessen Organe,</li>
              <li>den Trainingsverantwortlichen,</li>
              <li><strong>allen weiteren Teilnehmenden</strong> der Ausfahrt.</li>
            </ul>
            <p className="text-gray-600 mb-3">
              Ausgenommen hiervon sind Ansprueche, die auf Vorsatz oder grobe Fahrlaessigkeit zurueckzufuehren sind.
            </p>

            <h3 className="font-bold text-gray-800 mt-4 mb-1">Eigenverantwortung</h3>
            <p className="text-gray-600 mb-2">Ich bestaetige, dass ich fuer mich selbst und mein Verhalten waehrend des Trainings <strong>eigenverantwortlich</strong> bin. Insbesondere:</p>
            <ul className="list-disc ml-6 text-gray-600 mb-3 space-y-1">
              <li>Ich bin gesundheitlich in der Lage, an der Ausfahrt teilzunehmen.</li>
              <li>Mein Fahrrad ist in einem verkehrs- und betriebssicheren Zustand.</li>
              <li>Ich trage waehrend der Ausfahrt einen geeigneten Fahrradhelm.</li>
              <li>Ich halte mich an die Strassenverkehrsordnung (StVO).</li>
              <li>Ich verfuege ueber eine ausreichende Haftpflichtversicherung.</li>
              <li>Ich befolge die Anweisungen des Organisators.</li>
              <li>Ich habe die Bedingungen des RSV Stuttgart-Vaihingen fuer die Teilnahme an Ausfahrten zur Kenntnis genommen.</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 3. Bild- und Medienrechte */}
          <section>
            <h2 className="text-xl font-display font-bold text-primary border-b-2 border-red-100 pb-2 mb-3">3. Bild- und Medienrechte</h2>

            <p className="text-gray-600 mb-3">
              Im Rahmen des SkinfitCup-Vereinstrainings werden regelmaessig <strong>Fotos und Videos</strong> erstellt, die zur Dokumentation und Oeffentlichkeitsarbeit verwendet werden.
            </p>

            <h3 className="font-bold text-gray-800 mt-4 mb-1">Einwilligung zur Bildveroeffentlichung</h3>
            <p className="text-gray-600 mb-3">
              Mit meiner Teilnahme erklaere ich mich damit einverstanden, dass waehrend des Trainings angefertigte <strong>Fotos und Videoaufnahmen</strong>, auf denen ich abgebildet bin, fuer folgende Zwecke verwendet werden duerfen:
            </p>
            <ul className="list-disc ml-6 text-gray-600 mb-3 space-y-1">
              <li>Veroeffentlichung auf der SkinfitCup-Website (<a href="https://www.sfc-rsv.de" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.sfc-rsv.de</a>), insbesondere im Bereich &bdquo;Impressionen&ldquo;</li>
              <li>Darstellung in sozialen Medien (z.&thinsp;B. Instagram, Facebook) des Organisators oder des RSV Stuttgart-Vaihingen e.&thinsp;V.</li>
              <li>Berichterstattung ueber den SkinfitCup in vereinsinternen Medien</li>
              <li>Dokumentation und Archivierung der Veranstaltung</li>
            </ul>

            <h3 className="font-bold text-gray-800 mt-4 mb-1">Umfang und Rechte</h3>
            <p className="text-gray-600 mb-3">
              Die Einwilligung umfasst die <strong>unentgeltliche Nutzung</strong> der Aufnahmen in den oben genannten Medien. Eine Weitergabe an Dritte zu kommerziellen Zwecken erfolgt nicht. Die Aufnahmen werden ausschliesslich im Zusammenhang mit dem SkinfitCup und den Aktivitaeten des RSV Stuttgart-Vaihingen e.&thinsp;V. verwendet.
            </p>

            <h3 className="font-bold text-gray-800 mt-4 mb-1">Widerruf</h3>
            <p className="text-gray-600 mb-3">
              Die Einwilligung kann jederzeit <strong>schriftlich oder per E-Mail</strong> an den Organisator widerrufen werden (siehe Kontaktdaten unten). Im Falle eines Widerrufs werden betroffene Aufnahmen zeitnah aus den oben genannten Medien entfernt, soweit dies technisch moeglich und zumutbar ist. Der Widerruf gilt fuer die zukuenftige Verwendung; bereits erfolgte Veroeffentlichungen koennen aus technischen Gruenden (z.&thinsp;B. Caching, Druckerzeugnisse) nicht in jedem Fall rueckgaengig gemacht werden.
            </p>

            <div className="bg-red-50 border-l-4 border-primary p-4 rounded-r-lg">
              <p className="text-gray-800 text-sm">
                <strong>Hinweis:</strong> Solltest du nicht auf Fotos erscheinen wollen, informiere bitte den Organisator <strong>vor Beginn</strong> des jeweiligen Trainings. Wir werden dies bestmoeglich beruecksichtigen.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* 4. Bestaetigung */}
          <section>
            <h2 className="text-xl font-display font-bold text-primary border-b-2 border-red-100 pb-2 mb-3">4. Bestaetigung</h2>

            {isLoggedIn && alreadyAccepted && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-green-800 font-semibold">Du hast diese Teilnahmeerklaerung bei deiner Registrierung bestaetigt.</p>
              </div>
            )}

            {isLoggedIn && !alreadyAccepted && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-yellow-800">Du hast diese Teilnahmeerklaerung noch nicht bestaetigt. Dein Konto wurde vor Einfuehrung dieser Erklaerung erstellt. Bitte wende dich an den Organisator.</p>
              </div>
            )}

            {!isLoggedIn && (
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
                <p className="text-gray-700">Die Bestaetigung dieser Erklaerung erfolgt automatisch bei der <strong>Registrierung</strong>. Eine Registrierung ohne Zustimmung ist nicht moeglich.</p>
              </div>
            )}
          </section>

          <hr className="border-gray-200" />

          {/* 5. Organisator */}
          <section>
            <h2 className="text-xl font-display font-bold text-primary border-b-2 border-red-100 pb-2 mb-3">5. Organisator & Kontakt</h2>
            <div className="bg-red-50 border-l-4 border-primary p-4 rounded-r-lg">
              <p className="text-gray-800 font-semibold">Eberhard Janzen</p>
              <p className="text-gray-600">Rohrheimer Weg 43, 71735 Eberdingen</p>
              <p className="text-gray-600">E-Mail: <a href="mailto:eberhard.janzen50@gmail.com" className="text-primary hover:underline">eberhard.janzen50@gmail.com</a></p>
              <p className="text-gray-600">Telefon: <a href="tel:+491607029502" className="text-primary hover:underline">+49 160 7029502</a></p>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Vereinszugehoerigkeit: <strong>RSV Stuttgart-Vaihingen e.&thinsp;V.</strong> &middot; Diese Website wird privat betrieben und stellt kein offizielles Angebot des Vereins dar.
            </p>
          </section>

          <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-200 mt-6">
            Stand: Maerz 2026 &middot; SkinfitCup &middot; Eberhard Janzen
          </div>
        </div>
      </div>
    </div>
  );
};
