'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type UserRole = 'ministry' | 'superadmin' | 'admin' | 'doctor' | 'receptionist' | 'cashier' | 'lab' | 'pharmacy' | null;

export type Language = 'en' | 'lg' | 'sw' | 'fr';

interface AppState {
  role: UserRole;
  institutionId: string | null;
  staffId: string | null;
  staffName: string | null;
  activeEpisodeId: string | null;
  activePatientId: string | null;
  language: Language;
}

interface TranslationDictionary {
  [key: string]: Record<Language, string>;
}

export const translations: TranslationDictionary = {
  appName: { en: 'MedQR', lg: 'MedQR', sw: 'MedQR', fr: 'MedQR' },
  scanQr: { en: 'Scan QR', lg: 'Skanna QR', sw: 'Skanini QR', fr: 'Scanner QR' },
  helpFaq: { en: 'Help & FAQ', lg: 'Buyambi & FAQ', sw: 'Msaada na Maswali', fr: 'Aide & FAQ' },
  dashboard: { en: 'Dashboard', lg: 'Lupapulo', sw: 'Dashibodi', fr: 'Tableau de bord' },
  logistics: { en: 'Logistics', lg: 'Obulambulambu', sw: 'Uhusiano', fr: 'Logistique' },
  qrDirectory: { en: 'QR Directory', lg: 'Eterekero lya QR', sw: 'Orodha ya QR', fr: 'Répertoire QR' },
  registerCitizen: { en: 'Register Citizen', lg: 'Kwewandiisa Omuntu', sw: 'Jisajili Mwananchi', fr: 'Enregistrer Citoyen' },
  registerFacility: { en: 'Register Facility', lg: 'Kwewandiisa Ekisaawe', sw: 'Jisajili Kituo', fr: 'Enregistrer Établissement' },
  institutionAdmin: { en: 'Institution Admin', lg: 'Obulambulambu bwa Ekisaawe', sw: 'Menejimenti ya Kituo', fr: 'Admin Établissement' },
  registerStaff: { en: 'Register Staff', lg: 'Kwewandiisa Abakabazi', sw: 'Jisajili Wafanyikazi', fr: 'Enregistrer Personnel' },
  receptionCheckin: { en: 'Reception & Check-in', lg: 'Okuwandiika n\'Okunywera', sw: 'Ukaribishaji na Check-in', fr: 'Réception & Enregistrement' },
  cashierBilling: { en: 'Cashier & Billing', lg: 'Okusiima n\'Okusasula', sw: 'Kashia na Malipo', fr: 'Caisse & Facturation' },
  clinicalWorkspace: { en: 'Clinical Workspace', lg: 'Ekifo ky\'Obujanjabi', sw: 'Sehemu ya Kitendawili', fr: 'Espace Clinique' },
  pharmacyDispensing: { en: 'Pharmacy Dispensing', lg: 'Edduuka ly\'Eddagala', sw: 'Duka la Madawa', fr: 'Pharmacie' },
  labDiagnostics: { en: 'Lab Diagnostics', lg: 'Obujanjabi bwa Olab', sw: 'Utafiti wa Maabara', fr: 'Diagnostics Labo' },
  portalLogin: { en: 'Portal Login', lg: 'Okuyingira mu Portal', sw: 'Ingia kwenye Portal', fr: 'Connexion Portail' },
  logout: { en: 'Logout', lg: 'Fuluma', sw: 'Ondoka', fr: 'Déconnexion' },
  securityVerification: { en: 'Security Verification', lg: 'Okukakasa Obukuumi', sw: 'Uthibitisho wa Usalama', fr: 'Vérification de Sécurité' },
  enterPin: { en: 'Enter the patient\'s 4-digit security PIN to access their medical record.', lg: 'Yingiza PIN ey\'okukuumi ey\'ennukuta 4 okufuna obujanjabi bwa aliyo.', sw: 'Weka PIN ya usalama ya namba 4 ili upate rekodi za matibabu.', fr: 'Entrez le PIN de sécurité à 4 chiffres du patient pour accéder à son dossier médical.' },
  verifyAccess: { en: 'Verify & Access', lg: 'Kakasa & Yingira', sw: 'Thibitisha & Fikia', fr: 'Vérifier & Accéder' },
  cancel: { en: 'Cancel', lg: 'Sazaamu', sw: 'Ghairi', fr: 'Annuler' },
  scanNotificationSent: { en: 'Scan notification sent via SMS & Email to patient', lg: 'Okumanyisa kwakasendwa mu SMS ne Email eri aliyo', sw: 'Arifa ya usimamizi imetumwa kupitia SMS na Email kwa mgonjwa', fr: 'Notification de scan envoyée par SMS et Email au patient' },
  citizenAlerted: { en: 'The citizen has been alerted that their health pass was accessed.', lg: 'Omuntu akakasibwa nti pass y\'obujanjabi ye y\'eyolisibwa.', sw: 'Mwananchi ameonyeshwa kwamba passport yake ya afya imefikiwa.', fr: 'Le citoyen a été alerté que son passeport santé a été consulté.' },
  loadingMedicalHistory: { en: 'Loading Medical History', lg: 'Okutikka Obujanjabi', sw: 'Inapakia Historia ya Matibabu', fr: 'Chargement de l\'Historique Médical' },
  securelyRetrieving: { en: 'Securely retrieving your records...', lg: 'Okukima obujanjabi bwo mu bukuumi...', sw: 'Inapata rekodi zako kwa usalama...', fr: 'Récupération sécurisée de vos dossiers...' },
  openMedicalHistory: { en: 'Open Medical History', lg: 'Tikula Obujanjabi', sw: 'Fungua Historia ya Matibabu', fr: 'Ouvrir l\'Historique Médical' },
  validating: { en: 'Validating...', lg: 'Okukakasa...', sw: 'Inathibitisha...', fr: 'Validation...' },
  enterQrCode: { en: 'Enter or paste the citizen QR code value.', lg: 'Yingiza oba oteeka QR code y\'omuntu.', sw: 'Weka au bandia thamani ya QR code ya mwananchi.', fr: 'Entrez ou collez la valeur du QR code du citoyen.' },
  citizenFound: { en: 'Citizen Found', lg: 'Omuntu Affunidwa', sw: 'Mwananchi Ameundwa', fr: 'Citoyen Trouvé' },
  noEpisodes: { en: 'No medical episodes found for this citizen yet.', lg: 'Tewali bubonero bwa aliyo.', sw: 'Hakuna matukio ya matibabu yameundwa kwa huyu mwananchi bado.', fr: 'Aucun épisode médical trouvé pour ce citoyen.' },
  noDiagnosis: { en: 'No diagnosis notes for this episode.', lg: 'Tewali bubonero bwa aliyo.', sw: 'Hakuni maarifa ya ugonjwa kwa kipindi hiki.', fr: 'Aucune note de diagnostic pour cet épisode.' },
  noPrescriptions: { en: 'No prescriptions for this episode.', lg: 'Tewali eddagala ly\'obujanjabi.', sw: 'Hakuna madawa yaliyotolewa kwa kipindi hiki.', fr: 'Aucune prescription pour cet épisode.' },
  privacyNote: { en: 'For privacy, detailed diagnosis/lab notes may require institutional authorization.', lg: 'Olw\'obukuumi, amawulire g\'obujanjabi galina okuba n\'ekisa.', sw: 'Kwa usalama, maelezo ya kina ya ugonjwa/maabara yanaweza kuhitaji idhini ya taasisi.', fr: 'Pour la confidentialité, les notes détaillées de diagnostic/labo peuvent nécessiter une autorisation institutionnelle.' },
  pleaseEnterPin: { en: 'Please enter a valid 4-digit Security PIN', lg: 'Yingiza PIN ey\'okukuumi ey\'ennukuta 4 entondeke', sw: 'Tafadhali weka PIN ya usalama ya namba 4 iliyo sahihi', fr: 'Veuillez entrer un PIN de sécurité valide à 4 chiffres' },
  allTopics: { en: 'All Topics', lg: 'Byonna', sw: 'Mada Zote', fr: 'Tous les Sujets' },
  faqSubtitle: { en: 'Everything you need to know about MedQR health cards, patient portal access, staff workflows, and security.', lg: 'Eby\'okuyamba byonna ku MedQR: kakensa za kalinnya, portal za abantu, n\'empula za kujanjabi.', sw: 'Kila unachohitaji kujua kuhusu kadi za afya za MedQR, ufikiaji wa portal ya wagonjwa, na usalama.', fr: 'Tout ce que vous devez savoir sur les cartes de santé MedQR, l\'accès au portail patient et la sécurité.' },
  scanPatientRecord: { en: 'Scan Patient Record', lg: 'Skanna Obujanjabi', sw: 'Skanini Rekodi ya Mgonjwa', fr: 'Scanner le Dossier Patient' },
  retrieveDigitalHealthPass: { en: 'Retrieve digital health pass', lg: 'Funa pass y\'obujanjabi', sw: 'Pata pasipoti ya afya', fr: 'Récupérer le passeport santé' },
  staffWorkspaces: { en: 'Staff Workspaces', lg: 'Ebifo by\'Abakabazi', sw: 'Maeneo ya Kazi ya Wafanyikazi', fr: 'Espaces de Travail du Personnel' },
  doctorReceptionistLab: { en: 'Doctor, Receptionist, Lab', lg: 'Dokita, Okuwandiika, Olab', sw: 'Daktari, Karibishaji, Maabara', fr: 'Médecin, Réception, Labo' },
  ministryGovernance: { en: 'Ministry Governance', lg: 'Obulambulambu bwa Minisitule', sw: 'Utawala wa Wizara', fr: 'Gouvernance Ministérielle' },
  nationalHealthLogistics: { en: 'National health logistics', lg: 'Obulambulambu bwa eggwanga', sw: 'Uhusiano wa afya taifa', fr: 'Logistique sanitaire nationale' },
  quickLinks: { en: 'Quick Links', lg: 'Eby\'okukka mangu', sw: 'Viungo Cepesi', fr: 'Liens Rapides' },
  home: { en: 'Home', lg: 'Ekisumuluzo', sw: 'Nyumbani', fr: 'Accueil' },
  registerAnother: { en: 'Register Another', lg: 'Kwewandiisa Omulala', sw: 'Jisajili Mwingine', fr: 'Enregistrer un Autre' },
  printIdCard: { en: 'Print ID Card', lg: 'Kuba ID Card', sw: 'Chapa Kadi ya ID', fr: 'Imprimer la Carte d\'Identité' },
  registrationSuccessful: { en: 'Registration Successful!', lg: 'Kwewandiisa Kwatirwa!', sw: 'Usajili Umetokea!', fr: 'Inscription Réussie !' },
  citizenEnrolled: { en: 'The citizen has been enrolled. Preview the ID card below, then print it.', lg: 'Omuntu akuwedde. Laba ID card wammanga, ogikube.', sw: 'Mwananchi amesajiliwa. Angalia kadi ya ID hapa chini, kisha uchape.', fr: 'Le citoyen a été enregistré. Aperçu de la carte ci-dessous, puis imprimez-la.' },
  personalDetails: { en: 'Personal Details', lg: 'Ebikwata ku Muntu', sw: 'Maelezo ya Kibinafsi', fr: 'Détails Personnels' },
  medicalProfile: { en: 'Medical Profile', lg: 'Obujanjabi', sw: 'Wasifu wa Matibabu', fr: 'Profil Médical' },
  firstName: { en: 'First Name', lg: 'Erinnya ly\'Okubagulako', sw: 'Jina la Kwanza', fr: 'Prénom' },
  lastName: { en: 'Last Name', lg: 'Erinnya ly\'Amaka', sw: 'Jina la Mwisho', fr: 'Nom' },
  dateOfBirth: { en: 'Date of Birth', lg: 'Olunaku lw\'Okuvula', sw: 'Tarehe ya Kuzaliwa', fr: 'Date de Naissance' },
  gender: { en: 'Gender', lg: 'Ekika ky\'Omuntu', sw: 'Jinsia', fr: 'Genre' },
  bloodType: { en: 'Blood Type', lg: 'Ekika ky\'Omusaayi', sw: 'Kundi la Damu', fr: 'Groupe Sanguin' },
  securityPin: { en: 'Security PIN (4 digits)', lg: 'PIN ey\'okukuumi (ennukuta 4)', sw: 'PIN ya usalama (namba 4)', fr: 'PIN de Sécurité (4 chiffres)' },
  underlyingConditions: { en: 'Underlying Conditions', lg: 'Obubonero', sw: 'Magonjwa ya Awali', fr: 'Conditions Sous-jacentes' },
  medicalHistory: { en: 'Medical History', lg: 'Obujanjabi', sw: 'Historia ya Matibabu', fr: 'Antécédents Médicaux' },
  allergies: { en: 'Allergies', lg: 'Okulera', sw: 'Mzio', fr: 'Allergies' },
  registerAndGenerateIdCard: { en: 'Register & Generate ID Card', lg: 'Kwewandiisa & Kuba ID Card', sw: 'Jisajili & Tengeneza Kadi ya ID', fr: 'Enregistrer & Générer la Carte d\'Identité' },
  registeringCitizen: { en: 'Registering Citizen...', lg: 'Okwewandiisa Omuntu...', sw: 'Kusajili Mwananchi...', fr: 'Enregistrement du Citoyen...' },
  backToDashboard: { en: 'Back to Dashboard', lg: 'Dda ku Lupapulo', sw: 'Rudi kwenye Dashibodi', fr: 'Retour au Tableau de Bord' },
  staffUsername: { en: 'Staff Username', lg: 'Erinnya ly\'Omukabazi', sw: 'Jina la Mfanyikazi', fr: 'Nom d\'Utilisateur du Personnel' },
  staffPassword: { en: 'Staff Password', lg: 'Akasumuluzo k\'Omukabazi', sw: 'Nenosiri la Mfanyikazi', fr: 'Mot de Passe du Personnel' },
  signInToStaffPortal: { en: 'Sign in to Staff Portal', lg: 'Yingira mu Portal', sw: 'Ingia kwenye Portal ya Wafanyikazi', fr: 'Se Connecter au Portail du Personnel' },
  ministryPortal: { en: 'Ministry Portal', lg: 'Portal ya Minisitule', sw: 'Portal ya Wizara', fr: 'Portail Ministériel' },
  facilityAdminPortal: { en: 'Facility Admin Portal', lg: 'Portal ya Obulambulambu', sw: 'Portal ya Menejimenti ya Kituo', fr: 'Portail Admin de l\'Établissement' },
  facilityPortalKey: { en: 'Facility Portal Key (Optional)', lg: 'Akasumuluzo k\'Ekisaawe (si kyetaagisa)', sw: 'Ufunguo wa Portal ya Kituo (Hiari)', fr: 'Clé du Portail Établissement (Optionnel)' },
  administratorUsername: { en: 'Administrator Username', lg: 'Erinnya ly\'Obulambulambu', sw: 'Jina la Menejimenti', fr: 'Nom d\'Utilisateur Administrateur' },
  authenticateMinistryCredentials: { en: 'Authenticate Ministry Credentials', lg: 'Kakasa Obukuumi bwa Minisitule', sw: 'Thibitisha Cheti cha Wizara', fr: 'Authentifier les Identifiants Ministériels' },
  governmentOfficialId: { en: 'Government Official ID', lg: 'ID y\'Omukulu mu Gwanga', sw: 'Kitambulisho cha Afya Taifa', fr: 'Identifiant Officiel Gouvernemental' },
  securePasscode: { en: 'Secure Passcode', lg: 'Akasumuluzo k\'Obukuumi', sw: 'Nenosiri la Usalama', fr: 'Code Secret Sécurisé' },
  clinicalStaffLogin: { en: 'Clinical Staff Login', lg: 'Okuyingira kw\'Abakabazi', sw: 'Ingia kwenye Wafanyikazi wa Kitendawili', fr: 'Connexion Personnel Clinique' },
  secureAccess: { en: 'Secure access for Doctors, Receptionists, Cashiers, Lab & Pharmacy staff', lg: 'Okuyingira mu bukuumi eri abadokita, abawandiisi, abakasitoma, ab\'olab, n\'ab\'edduuka', sw: 'Ufikiaji wa usalama kwa Madaktari, Wahudumu, Wakashia, Maabara na Dawa', fr: 'Accès sécurisé pour Médecins, Réceptionnistes, Caissiers, Labo & Pharmacie' },
  notAStaffMember: { en: 'Not a staff member? Use the dedicated portals:', lg: 'Toili omukabazi? Kozesa portal ey\'ewunyolo:', sw: 'Sio mfanyikazi? Tumia portal mahususi:', fr: 'Pas membre du personnel ? Utilisez les portails dédiés :' },
  facilityAdministration: { en: 'Facility Administration', lg: 'Obulambulambu bwa Ekisaawe', sw: 'Menejimenti ya Kituo', fr: 'Administration de l\'Établissement' },
  ministryControlCenter: { en: 'Ministry Control Center', lg: 'Woola lya Minisitule', sw: 'Kituo cha Udhibiti wa Wizara', fr: 'Centre de Contrôle Ministériel' },
  signInToFacilityPortal: { en: 'Sign In to Facility Portal', lg: 'Yingira mu Portal y\'Ekisaawe', sw: 'Ingia kwenye Portal ya Kituo', fr: 'Se Connecter au Portail de l\'Établissement' },
  registerHealthcareFacility: { en: 'Register Healthcare Facility', lg: 'Kwewandiisa Ekisaawe ky\'Obujanjabi', sw: 'Jisajili Kituo cha Afya', fr: 'Enregistrer un Établissement de Santé' },
  institutionName: { en: 'Institution Name', lg: 'Erinnya lya Ekisaawe', sw: 'Jina la Taasisi', fr: 'Nom de l\'Établissement' },
  licenseNumber: { en: 'License Number', lg: 'Namba y\'Ekisaawe', sw: 'Namba ya Leseni', fr: 'Numéro de Licence' },
  fullAddress: { en: 'Full Address / Location', lg: 'Ekifo ky\'Ekisaawe', sw: 'Anwani Kamili / Mahali', fr: 'Adresse Complète / Lieu' },
  ownerDirectorName: { en: 'Owner / Director Name', lg: 'Erinnya ly\'Mukama', sw: 'Jina la Mmiliki / Menejimenti', fr: 'Nom du Propriétaire / Directeur' },
  servicesOffered: { en: 'Services Offered (comma separated)', lg: 'Eby\'okukola (yawula ne comma)', sw: 'Huduma Zinazotolewa (tenganisha na koma)', fr: 'Services Proposés (séparés par des virgules)' },
  processingRegistration: { en: 'Processing Registration...', lg: 'Okukakasa Okwewandiisa...', sw: 'Inashughulikia Usajili...', fr: 'Traitement de l\'Inscription...' },
  authorizeInstitution: { en: 'Authorize Institution', lg: 'Kakasa Ekisaawe', sw: 'Ridhisha Taasisi', fr: 'Autoriser l\'Établissement' },
  registerStaffMember: { en: 'Register Staff Member', lg: 'Kwewandiisa Omukabazi', sw: 'Jisajili Mfanyikazi', fr: 'Enregistrer un Membre du Personnel' },
  fullName: { en: 'Full Name', lg: 'Erinnya lyonna', sw: 'Jina Kamili', fr: 'Nom Complet' },
  occupationRole: { en: 'Occupation / Role', lg: 'Omulimo / Omukago', sw: 'Utafiti / Nafasi', fr: 'Profession / Rôle' },
  medicalSpecializations: { en: 'Medical Specializations', lg: 'Eby\'okujanjabi', sw: 'Utafiti wa Matibabu', fr: 'Spécialisations Médicales' },
  selectAllApplicableServices: { en: 'Select all applicable services for this doctor', lg: 'Londa byonna ebisobola okukolebwa', sw: 'Chagua huduma zote zinazofaa kwa huyu daktari', fr: 'Sélectionnez tous les services applicables pour ce médecin' },
  portalCredentials: { en: 'Portal Credentials', lg: 'Eby\'okuyingira', sw: 'Kitambulisho cha Portal', fr: 'Identifiants du Portail' },
  username: { en: 'Username', lg: 'Erinnya', sw: 'Jina la Mtumiaji', fr: 'Nom d\'Utilisateur' },
  password: { en: 'Password', lg: 'Akasumuluzo', sw: 'Nenosiri', fr: 'Mot de Passe' },
  registerFacilityStaffMember: { en: 'Register Facility Staff Member', lg: 'Kwewandiisa Omukabazi w\'Ekisaawe', sw: 'Jisajili Mfanyikazi wa Kituo', fr: 'Enregistrer un Membre du Personnel de l\'Établissement' },
  expandYourMedicalTeam: { en: 'Expand your medical facility team by registering Doctors, Nurses, Receptionists, Pharmacists, and Cashiers.', lg: 'Yongeza ku bakabazi b\'ekisaawe ky\'obujanjabi', sw: 'Ondoa timu ya kituo chako cha afya kwa kusajili Madaktari, Wauguzi, Wahudumu, Wafanyabiashara, na Wakashia.', fr: 'Développez votre équipe médicale en enregistrant Médecins, Infirmiers, Réceptionnistes, Pharmaciens et Caissiers.' },
  citizenPhoto: { en: 'Citizen Photo', lg: 'Eifananyi ly\'Omuntu', sw: 'Picha ya Mwananchi', fr: 'Photo du Citoyen' },
  takeWebcamPhoto: { en: 'Open Webcam', lg: 'Yingiza Kamera', sw: 'Fungua Kamera', fr: 'Ouvrir la Caméra' },
  capturePhoto: { en: 'Capture Photo', lg: 'Kuba Eifananyi', sw: 'Chukua Picha', fr: 'Prendre une Photo' },
  replacePhoto: { en: 'Replace Photo', lg: 'Kuba Eifananyi Eripya', sw: 'Badilisha Picha', fr: 'Remplacer la Photo' },
  uploadFromDevice: { en: 'Upload from Device', lg: 'Yingiza okuva ku Kompyuta', sw: 'Pakia kutoka Kifaa', fr: 'Télécharger depuis l\'Appareil' },
  photoReady: { en: 'Photo ready — will appear on card', lg: 'Eifananyi litegekedwa — lijja kuba ku card', sw: 'Picha imewekwa — itajitokeza kwenye kadi', fr: 'Photo prête — apparaîtra sur la carte' },
  openWebcam: { en: 'Open Webcam', lg: 'Yingiza Kamera', sw: 'Fungua Kamera', fr: 'Ouvrir la Caméra' },
  registerCitizenPage: { en: 'Register Citizen', lg: 'Kwewandiisa Omuntu', sw: 'Jisajili Mwananchi', fr: 'Enregistrer un Citoyen' },
  citizenEnrollment: { en: 'Citizen Enrollment & Health ID Registration', lg: 'Kwewandiisa n\'Okufuna ID y\'Obujanjabi', sw: 'Usajili wa Wananchi na Usajili wa Kadi ya ID ya Afya', fr: 'Inscription des Citoyens et Enregistrement de la Carte d\'Identité Sanitaire' },
  enrollCitizen: { en: 'Enroll a new citizen into the National Health Registry and generate their encrypted MedQR identity pass.', lg: 'Yingiza omuntu omupya mu National Health Registry ofune MedQR ID ye.', sw: 'Jisajili mwananchi mpya katika Rejesta ya Afya ya Taifa na upate pasipoti ya utambulisho ya MedQR.', fr: 'Inscrivez un nouveau citoyen dans le Registre National de Santé et générez son passeport d\'identité MedQR chiffré.' },
  registrationError: { en: 'Registration Error', lg: 'Ensobi mu Kwewandiisa', sw: 'Kosa la Usajili', fr: 'Erreur d\'Inscription' },
  noPhotoYet: { en: 'No photo yet', lg: 'Tewali eifananyi', sw: 'Bado hakuna picha', fr: 'Pas encore de photo' },
  cameraNotAvailable: { en: 'Camera not available. Please upload a photo instead.', lg: 'Kamera teli. Yingiza eifananyi mu ky\'okola.', sw: 'Kamera haipatikani. Tafadhali pakia picha badala yake.', fr: 'Caméra non disponible. Veuillez télécharger une photo à la place.' },
  takePhotoOrUpload: { en: 'Take a webcam photo or upload from your device. The photo will be printed on the ID card.', lg: 'Kuba eifananyi oba oyingiza okuva ku kompyuta. Eifananyi lijja kuba ku ID card.', sw: 'Chukua picha ya kamera au pakia kutoka kifaa chako. Picha itachapwa kwenye kadi ya ID.', fr: 'Prenez une photo webcam ou téléchargez depuis votre appareil. La photo sera imprimée sur la carte d\'identité.' },
  nameRequired: { en: 'Name is required', lg: 'Erinnya linafuula', sw: 'Jina inahitajika', fr: 'Le nom est requis' },
  'e.gJohn': { en: 'E.g., John', lg: 'E.g., John', sw: 'Mf., John', fr: 'Ex., Jean' },
  'e.gDoe': { en: 'E.g., Doe', lg: 'E.g., Doe', sw: 'Mf., Doe', fr: 'Ex., Dupont' },
  'e.gMULAGOKEY2025': { en: 'E.g., MULAGO-KEY-2025', lg: 'E.g., MULAGO-KEY-2025', sw: 'Mf., MULAGO-KEY-2025', fr: 'Ex., MULAGO-KEY-2025' },
  'e.gAlice': { en: 'E.g., alice.j', lg: 'E.g., alice.j', sw: 'Mf., alice.j', fr: 'Ex., alice.j' },
  select: { en: 'Select...', lg: 'Londa...', sw: 'Chagua...', fr: 'Sélectionner...' },
  male: { en: 'Male', lg: 'Omulenzi', sw: 'Mwanaume', fr: 'Masculin' },
  female: { en: 'Female', lg: 'Omukazi', sw: 'Mwanamke', fr: 'Féminin' },
  other: { en: 'Other', lg: 'Eddala', sw: 'Nyingine', fr: 'Autre' },
  selectBloodType: { en: 'Select Blood Type...', lg: 'Londa ekika ky\'omusaayi...', sw: 'Chagua Kundi la Damu...', fr: 'Sélectionner le Groupe Sanguin...' },
  age: { en: 'Age', lg: 'Emyaka', sw: 'Umri', fr: 'Âge' },
  ageRequired: { en: 'Age is required', lg: 'Emmyaka ginafuula', sw: 'Umri unahitajika', fr: 'L\'âge est requis' },
  selectRole: { en: 'Select a role...', lg: 'Londa omukago...', sw: 'Chagua wadhifa...', fr: 'Sélectionner un rôle...' },
  doctor: { en: 'Doctor', lg: 'Dokita', sw: 'Daktari', fr: 'Médecin' },
  receptionist: { en: 'Receptionist', lg: 'Okuwandiika', sw: 'Mkaribishaji', fr: 'Réceptionniste' },
  accountantCashier: { en: 'Accountant / Cashier', lg: 'Omukasitoma / Omukasiima', sw: 'Mhasibu / Mkashia', fr: 'Comptable / Caissier' },
  pharmacist: { en: 'Pharmacist', lg: 'Omukatale', sw: 'Mfanyabiashara wa Madawa', fr: 'Pharmacien' },
  labTechnician: { en: 'Lab Technician', lg: 'Omukenesi', sw: 'Mfanyabiashara wa Maabara', fr: 'Technicien de Labo' },
  roleRequired: { en: 'Role is required', lg: 'Omukago ginafuula', sw: 'Wadhifa unahitajika', fr: 'Le rôle est requis' },
  usernameRequired: { en: 'Username required', lg: 'Erinnya linafuula', sw: 'Jina la mtumiaji linahitajika', fr: 'Nom d\'utilisateur requis' },
  passwordRequired: { en: 'Password required', lg: 'Akasumuluzo kinafuula', sw: 'Nenosiri linahitajika', fr: 'Mot de passe requis' },
  search: { en: 'Search', lg: 'Noonya', sw: 'Tafuta', fr: 'Rechercher' },
  searching: { en: 'Searching...', lg: 'Okunoonya...', sw: 'Inatafuta...', fr: 'Recherche...' },
  episodeCode: { en: 'Episode Code', lg: 'Kodi y\'Obubonero', sw: 'Kodi ya Matukio', fr: 'Code d\'Épisode' },
  accessPatientRecord: { en: 'Access Patient Record', lg: 'Yingira mu Bujanjabi', sw: 'Fikia Rekodi ya Mgonjwa', fr: 'Accéder au Dossier Patient' },
  todaysEpisodes: { en: 'Today\'s Episodes', lg: 'Obubonero bw\'Olwa leero', sw: 'Matukio ya Leo', fr: 'Épisodes d\'Aujourd\'hui' },
  myQueue: { en: 'My Queue', lg: 'Lolufu lwange', sw: 'Fungu langu', fr: 'Ma File' },
  allEpisodes: { en: 'All Episodes', lg: 'Obubonero Bwonna', sw: 'Matukio Yote', fr: 'Tous les Épisodes' },
  noEpisodesAssigned: { en: 'No episodes assigned to you today.', lg: 'Tewali bubonero bweewandiisibwa leero.', sw: 'Hakuna matukio yaliyowekwa kwako leo.', fr: 'Aucun épisode ne vous est assigné aujourd\'hui.' },
  noEpisodesToday: { en: 'No episodes today.', lg: 'Tewali bubonero leero.', sw: 'Hakuna matukio leo.', fr: 'Aucun épisode aujourd\'hui.' },
  continue: { en: 'Continue', lg: 'Weyongere', sw: 'Endelea', fr: 'Continuer' },
  consultationRoom: { en: 'Consultation Room', lg: 'Ekifo ky\'Obujanjabi', sw: 'Chumba cha Utafiti', fr: 'Salle de Consultation' },
  loading: { en: 'Loading...', lg: 'Okutikka...', sw: 'Inapakia...', fr: 'Chargement...' },
  loadingEpisodes: { en: 'Loading episodes...', lg: 'Okutikka obubonero...', sw: 'Inapakia matukio...', fr: 'Chargement des épisodes...' },
  patientName: { en: 'Patient', lg: 'Omuntu', sw: 'Mgonjwa', fr: 'Patient' },
  status: { en: 'Status', lg: 'Embeera', sw: 'Hali', fr: 'Statut' },
  action: { en: 'Action', lg: 'Ekikolwa', sw: 'Kitendo', fr: 'Action' },
  unknown: { en: 'unknown', lg: 'tebamanyidwa', sw: 'isiyojulikana', fr: 'inconnu' },
  locateInvestigation: { en: 'Locate Investigation by Episode Code...', lg: 'Noonya Obujanjabi ne Kodi...', sw: 'Tafuta Utafiti kwa Kodi ya Matukio...', fr: 'Localiser l\'Investigation par Code d\'Épisode...' },
  synchronizingLabQueue: { en: 'Synchronizing laboratory queue...', lg: 'Okutikka olab...', sw: 'Inasawazisha foleni ya maabara...', fr: 'Synchronisation de la file de laboratoire...' },
  labQueueEmpty: { en: 'Lab Queue Empty', lg: 'Olab Tewali', sw: 'Foleni ya Maabara Tupu', fr: 'File de Labo Vide' },
  noPendingInvestigations: { en: 'No pending investigative orders in the national queue.', lg: 'Tewali bubonero mu national queue.', sw: 'Hakuna maagizo ya utafiti yanayosubiri kwenye foleni ya taifa.', fr: 'Aucune ordre d\'investigation en attente dans la file nationale.' },
  processInvestigation: { en: 'Process Investigation', lg: 'Kola Obujanjabi', sw: 'Shughulikia Utafiti', fr: 'Traiter l\'Investigation' },
  waiting: { en: 'Waiting', lg: 'Okulindirira', sw: 'Inasubiri', fr: 'En Attente' },
  backToQueue: { en: 'Back to Queue', lg: 'Dda ku Foleni', sw: 'Rudi kwenye Foleni', fr: 'Retour à la File' },
  laboratoryDiagnostics: { en: 'Laboratory Diagnostics', lg: 'Obujanjabi bwa Olab', sw: 'Utafiti wa Maabara', fr: 'Diagnostics de Laboratoire' },
  processDiagnosticTests: { en: 'Process diagnostic test investigations, record verified results, and synchronize with national health records.', lg: 'Kola obujanjabi, record results, ne synchronize na national health records.', sw: 'Shughulikia uchunguzi wa magonjwa, rekhodi matokeo yaliyothibitishwa, na sawazisha na rekodi za afya za taifa.', fr: 'Traiter les investigations de tests diagnostiques, enregistrer les résultats vérifiés et synchroniser avec les dossiers de santé nationaux.' },
  pendingInvestigations: { en: 'Pending Investigations', lg: 'Obujanjabi', sw: 'Utafiti Unaosubiri', fr: 'Investigations en Attente' },
  investigationResults: { en: 'Investigation Results / Observations', lg: 'Eby\'okufuna', sw: 'Matokeo ya Utafiti / Maoni', fr: 'Résultats d\'Investigation / Observations' },
  recordFindings: { en: 'Record findings, measurements, and clinical observations...', lg: 'Record eby\'okufuna...', sw: 'Rekodi matokeo, vipimo, na maoni ya kitendawili...', fr: 'Enregistrer les résultats, mesures et observations cliniques...' },
  synchronizeResults: { en: 'Synchronize Results', lg: 'Synchronize Eby\'okufuna', sw: 'Sawazisha Matokeo', fr: 'Synchroniser les Résultats' },
  verifiedResult: { en: 'Verified Result', lg: 'Eby\'okufuna Byakakasibwa', sw: 'Matokeo Yanayothibitishwa', fr: 'Résultat Vérifié' },
  laboratoryResults: { en: 'Laboratory Results', lg: 'Eby\'okufuna by\'Olab', sw: 'Matokeo ya Maabara', fr: 'Résultats de Laboratoire' },
  loadingLabResults: { en: 'Loading lab results...', lg: 'Okutikka eby\'okufuna...', sw: 'Inapakia matokeo ya maabara...', fr: 'Chargement des résultats de labo...' },
  noLabResults: { en: 'No Laboratory Results', lg: 'Tewali Eby\'okufuna', sw: 'Hakuna Matokeo ya Maabara', fr: 'Aucun Résultat de Laboratoire' },
  noTestResultsAvailable: { en: 'No test results available for this episode yet.', lg: 'Tewali eby\'okufuna.', sw: 'Hakuna matokeo ya vipimo yanayopatikana kwa kipindi hiki bado.', fr: 'Aucun résultat de test disponible pour cet épisode pour l\'instant.' },
  completed: { en: 'Completed', lg: 'Kutuuka', sw: 'Imekamilika', fr: 'Terminé' },
  awaitingProcessing: { en: 'Awaiting Processing', lg: 'Okulindirira', sw: 'Inasubiri Usindikaji', fr: 'En Attente de Traitement' },
  results: { en: 'Results', lg: 'Eby\'okufuna', sw: 'Matokeo', fr: 'Résultats' },
  pharmacologicalTreatment: { en: 'Pharmacological Treatment', lg: 'Eddagala', sw: 'Ushauri wa Madawa', fr: 'Traitement Pharmacologique' },
  medicationName: { en: 'Medication Name', lg: 'Erinnya ly\'Eddagala', sw: 'Jina la Dawa', fr: 'Nom du Médicament' },
  dosageRegime: { en: 'Dosage Regime', lg: 'Eddagala', sw: 'Dosisi', fr: 'Régime de Dosage' },
  instructions: { en: 'Instructions', lg: 'Eby\'okukola', sw: 'Maagizo', fr: 'Instructions' },
  addAdditionalMedication: { en: 'Add Additional Medication', lg: 'Yongera Eddagala', sw: 'Ongeza Dawa Zingine', fr: 'Ajouter un Médicament Supplémentaire' },
  authorizeAndTransmit: { en: 'Authorize & Transmit to Pharmacy', lg: 'Kakasa & Tumira Edduuka', sw: 'Ridhisha & Tuma kwa Duka la Madawa', fr: 'Autoriser & Transmettre à la Pharmacie' },
  prescriptionTransmitted: { en: 'Prescription transmitted to Pharmacy.', lg: 'Eddagala lyatumiddwa.', sw: 'Prescription imetumwa kwa Duka la Madawa.', fr: 'Ordonnance transmise à la Pharmacie.' },
  patientReferred: { en: 'Patient referred to ${name}.', lg: 'Omuntu yatumiddwa ku ${name}.', sw: 'Mgonjwa ametumwa kwa ${name}.', fr: 'Patient réorienté vers ${name}.' },
  failedToSendReferral: { en: 'Failed to send referral', lg: 'Okutuma kulemera', sw: 'Kushindwa kutuma rejerali', fr: 'Échec de l\'envoi de la référence' },
  diagnosisUpdated: { en: 'Diagnosis updated and saved to medical record.', lg: 'Obujanjabi busalidwa.', sw: 'Ugonjwa umesasishwa na kuhifadhiwa kwenye rekodi ya matibabu.', fr: 'Diagnostic mis à jour et enregistré dans le dossier médical.' },
  labTestsRequested: { en: '${count} Laboratory tests requested.', lg: 'Obujanjabi ${count} bufunitibwa.', sw: 'Vipimo vya maabara ${count} vyaombwa.', fr: '${count} tests de laboratoire demandés.' },
  paymentType: { en: 'Payment Type', lg: 'Ekika ky\'Esasula', sw: 'Aina ya Malipo', fr: 'Type de Paiement' },
  consultationFee: { en: 'Consultation Fee', lg: 'Ensasula y\'Obujanjabi', sw: 'Malipo ya Utafiti', fr: 'Frais de Consultation' },
  referralFee: { en: 'Referral Fee', lg: 'Ensasula y\'Okutumibwa', sw: 'Malipo ya Rejerali', fr: 'Frais de Référence' },
  laboratoryTest: { en: 'Laboratory Test', lg: 'Obujanjabi', sw: 'Testi ya Maabara', fr: 'Test de Laboratoire' },
  pharmacyPayment: { en: 'Pharmacy', lg: 'Edduuka', sw: 'Madawa', fr: 'Pharmacie' },
  amount: { en: 'Amount (UGX)', lg: 'Ensasula (UGX)', sw: 'Kiasi (UGX)', fr: 'Montant (UGX)' },
  description: { en: 'Description (Optional)', lg: 'Eby\'okukola (si kyetaagisa)', sw: 'Maelezo (Hiari)', fr: 'Description (Optionnel)' },
  totalDue: { en: 'Total Due', lg: 'Ensasula Yonna', sw: 'Jumla ya Malipo', fr: 'Total Dû' },
  selectPaymentMethod: { en: 'Select Payment Method', lg: 'Londa Engeri y\'Okusasula', sw: 'Chagua Njia ya Malipo', fr: 'Sélectionner le Mode de Paiement' },
  mobile: { en: 'Mobile', lg: 'Sasula ne Simu', sw: 'Simu', fr: 'Mobile' },
  cash: { en: 'Cash', lg: 'Sasula ne Sente', sw: 'Fedha', fr: 'Espèces' },
  healthCard: { en: 'Health Card', lg: 'Card y\'Obujanjabi', sw: 'Kadi ya Afya', fr: 'Carte de Santé' },
  authorizePayment: { en: 'Authorize Payment', lg: 'Kakasa Esasula', sw: 'Ridhisha Malipo', fr: 'Autoriser le Paiement' },
  transactionApproved: { en: 'Transaction Approved', lg: 'Esasula Yakkirizibwa', sw: 'Muamala Umeridhishwa', fr: 'Transaction Approuvée' },
  consultationFeeReceived: { en: 'Consultation fee received. Episode ${code} has been promoted to clinical queue.', lg: 'Ensasula y\'obujanjabi yakkirizibwa. Obubonero ${code} buyigiddwa mu queue.', sw: 'Malipo ya ufafanuzi yamepokelewa. Matukio ${code} yameongezwa kwenye foleni ya kliniki.', fr: 'Frais de consultation reçus. L\'épisode ${code} a été promu dans la file clinique.' },
  nextStep: { en: 'Next Step: Direct Patient to Doctor\'s Consultation Room', lg: 'Ekikolwa okiddako: Yingiza Omuntu mu Kiroomu ky\'Dokita', sw: 'Hatua inayofuata: Mwongezee Mgonjwa Chumbani cha Utafiti wa Daktari', fr: 'Prochaine Étape : Diriger le Patient vers la Salle de Consultation du Médecin' },
  processNextBilling: { en: 'Process Next Billing', lg: 'Kola Esasula Enddala', sw: 'Shughulikia Malipo Yafuatayo', fr: 'Traiter la Facturation Suivante' },
  billed: { en: 'Billed', lg: 'Esasuliddwa', sw: 'Imewekwa', fr: 'Facturé' },
  collected: { en: 'Collected', lg: 'Ekikuumiddwa', sw: 'Imekusanywa', fr: 'Collecté' },
  episodeSettlement: { en: 'Episode Settlement', lg: 'Okusalira Obubonero', sw: 'Malipo ya Matukio', fr: 'Règlement d\'Épisode' },
  serviceCharge: { en: 'Service Charge', lg: 'Ensasula', sw: 'Kodi ya Huduma', fr: 'Frais de Service' },
  standardConsultation: { en: 'Standard Consultation', lg: 'Obujanjabi', sw: 'Utafiti wa Kawaida', fr: 'Consultation Standard' },
  receptionistCheckin: { en: 'Receptionist & Patient Check-in', lg: 'Okuwandiika n\'Okunywera', sw: 'Ukaribishaji na Check-in', fr: 'Réception & Enregistrement' },
  patientReception: { en: 'Patient Reception & Rapid Check-in', lg: 'Okwewandiisa Omuntu', sw: 'Ukaribishaji wa Mgonjwa na Uingizaji Haraka', fr: 'Réception et Enregistrement Rapide des Patients' },
  awaitingIdentification: { en: 'Awaiting Identification', lg: 'Okulindirira Okumanyibwa', sw: 'Inasubiri Utambuzi', fr: 'En Attente d\'Identification' },
  alignCard: { en: 'Align the patient\'s card within the frame below', lg: 'Teeka card y\'omuntu mu frame wammanga', sw: 'Panga kadi ya mgonjwa ndani ya fremu hapa chini', fr: 'Alignez la carte du patient dans le cadre ci-dessous' },
  realTimeScannerActive: { en: 'Real-time scanner active', lg: 'Scanner akola', sw: 'Skanner inashirikia', fr: 'Scanner actif en temps réel' },
  patientIdentified: { en: 'Patient Identified', lg: 'Omuntu Amanyidwa', sw: 'Mgonjwa Ametambuliwa', fr: 'Patient Identifié' },
  newScan: { en: 'New Scan', lg: 'Skanna Endala', sw: 'Skani Mpya', fr: 'Nouvelle Analyse' },
  personalIdentity: { en: 'Personal Identity', lg: 'Eby\'omuntu', sw: 'Utambulisho wa Kibinafsi', fr: 'Identité Personnelle' },
  bloodGroup: { en: 'Blood Group', lg: 'Ekika ky\'Omusaayi', sw: 'Kundi la Damu', fr: 'Groupe Sanguin' },
  urgentMedicalAlerts: { en: 'Urgent Medical Alerts', lg: 'Amawulire g\'Obujanjabi', sw: 'Arifa za Matibabu za Haraka', fr: 'Alertes Médicales Urgentes' },
  noCriticalAlerts: { en: 'No critical alerts found', lg: 'Tewali amawulire', sw: 'Hakuna arifa muhimu', fr: 'Aucune alerte critique trouvée' },
  assignDoctor: { en: 'Assign Doctor', lg: 'Kwatira Dokita', sw: 'Weka Daktari', fr: 'Affecter un Médecin' },
  noDoctorsAvailable: { en: 'No doctors available. The episode will be unassigned.', lg: 'Tewali madokita. Obubonero buliyo nga tebiri ku muntu.', sw: 'Hakuna madaktari. Matukio yatabaguliwa.', fr: 'Aucun médecin disponible. L\'épisode ne sera pas assigné.' },
  initiateMedicalEpisode: { en: 'Initiate Medical Episode', lg: 'Tandika Obubonero', sw: 'Anzisha Matukio ya Matibabu', fr: 'Initier un Épisode Médical' },
  episodeSynchronized: { en: 'Episode Synchronized', lg: 'Obubonero Buyigiddwa', sw: 'Matukio Yameunganishwa', fr: 'Épisode Synchronisé' },
  medicalEpisodeCreated: { en: 'Medical episode created successfully. National ID and tracking code assigned.', lg: 'Obubonero bututte. ID y\'eggwanga ne kodi biweereddwa.', sw: 'Matukio ya matibabu yameundwa kwa mafanikio. Kitambulisho cha taifa na kodi ya ufuatiliaji zimepewa.', fr: 'Épisode médical créé avec succès. ID national et code de suivi attribués.' },
  uniqueEpisodeCode: { en: 'Unique Episode Code', lg: 'Kodi y\'Obubonero', sw: 'Kodi ya Matukio', fr: 'Code d\'Épisode Unique' },
  directionCashier: { en: 'Direction: Proceed to Cashier for Consultation Payment', lg: 'Kkka ku Kasitoma okusasula', sw: 'Mweleke: Nenda kwa Mkashia kulipa Malipo ya Utafiti', fr: 'Direction : Se rendre au Caissier pour le Paiement de la Consultation' },
  finishReset: { en: 'Finish & Reset for Next Patient', lg: 'Mirira & Jatula ku Muntu Olanda', sw: 'Maliza & Weka upya kwa Mgonjwa Mwingine', fr: 'Terminer & Réinitialiser pour le Prochain Patient' },
  categoryCitizens: { en: 'Citizens & Patients', lg: 'Abantu & Abalwadde', sw: 'Wananchi na Wagonjwa', fr: 'Citoyens & Patients' },
  categoryClinical: { en: 'Clinical & Hospital Staff', lg: 'Abakabazi b\'Edduuka', sw: 'Wafanyikazi wa Kitendawili na Hospitali', fr: 'Personnel Clinique & Hospitalier' },
  categoryInstitutions: { en: 'Institutions & Governance', lg: 'Amasinsi & Obulambulambu', sw: 'Taasisi na Utawala', fr: 'Établissements & Gouvernance' },
  faqHowToUseCard: { en: 'How do I use my MedQR Health Identity Card?', lg: 'Nfuna ntya MedQR ID card yange?', sw: 'Ninatumiaje kadi yangu ya utambulisho wa afya ya MedQR?', fr: 'Comment utiliser ma carte d\'identité santé MedQR ?' },
  faqHowToUseCardAnswer: { en: 'Show your MedQR Card or mobile QR code to the receptionist when arriving at any registered healthcare facility. The receptionist scans your code to immediately pull up your record and start your episode.', lg: 'Laga MedQR card yo oba QR code ku receptionist bw\'otuuka mu kisaawe ky\'obujanjabi. Receptionist askanna kodi yo okutikka obujanjabi bwo.', sw: 'Onyesha kadi yako ya MedQR au QR code ya simu kwa mkaribishaji unapofika kituo chochote cha afya kilichosajiliwa. Mkaribishaji anaskan kodi yako ili kufungua rekodi yako na kuanza kipindi chako.', fr: 'Montrez votre carte MedQR ou votre code QR mobile à l\'accueil lors de votre arrivée dans tout établissement de santé enregistré. L\'accueil scanne votre code pour accéder immédiatement à votre dossier et commencer votre épisode.' },
  faqScanNotification: { en: 'Will I be notified when my QR card is scanned?', lg: 'Nnima kumanyisibwa nga card yange eskannibwa?', sw: 'Nitapata arifa kadi yangu ya QR inaposkanwa?', fr: 'Serai-je notifié lorsque ma carte QR est scannée ?' },
  faqScanNotificationAnswer: { en: 'Yes! MedQR automatically dispatches an instant SMS & Email notification to your registered contact number whenever a healthcare provider or hospital scans your digital health pass.', lg: 'Yee! MedQR egasa SMS ne Email buli wamu card eskannibwa.', sw: 'Ndio! MedQR inatuma SMS na Email moja kwa moja kwa namba yako iliyosajiliwa kila daktari au hospitali inaposkan pasipoti yako ya afya.', fr: 'Oui ! MedQR envoie automatiquement une notification instantanée par SMS et Email à votre numéro de contact enregistré chaque fois qu\'un prestataire de santé ou un hôpital scanne votre passeport sanitaire numérique.' },
  faqDataProtection: { en: 'How is my medical data protected?', lg: 'Data yange ey\'obujanjabi ekumaibwa tutya?', sw: 'Data yangu ya matibabu inalindwa vipi?', fr: 'Comment mes données médicales sont-elles protégées ?' },
  faqDataProtectionAnswer: { en: 'Your health records are stored in encrypted form adhering to Ministry of Health data protection standards. Patient Portal access requires 2-factor authentication or your security PIN.', lg: 'Obujanjabi bwo buzingiddwa mu encryption. Portal erina okukakasa obukuumi oba PIN.', sw: 'Rekodi zako za afya zimehifadhiwa kwa fomu ya usimbaji data kwa kufuata viwango vya ulinzi wa data wa Wizara ya Afya. Ufikiaji wa Portal ya Mgonjwa unahitaji uthibitisho wa vipengele viwili au PIN yako ya usalama.', fr: 'Vos dossiers de santé sont stockés sous forme chiffrée conformément aux normes de protection des données du Ministère de la Santé. L\'accès au portail patient nécessite une authentification à 2 facteurs ou votre PIN de sécurité.' },
  faqPatientRouting: { en: 'How does patient routing to specific Doctors work?', lg: 'Okutuma omuntu ku dokita kola tutya?', sw: 'Utoaji mgonjwa kwa madaktari maalum unafanyaje?', fr: 'Comment fonctionne l\'orientation des patients vers des médecins spécifiques ?' },
  faqPatientRoutingAnswer: { en: 'During check-in, the receptionist assigns the patient to a specific Doctor or Specialty. Once cleared by the cashier, the patient\'s record flows directly into that assigned Doctor\'s queue.', lg: 'Mu reception, receptionist akwata omuntu amuweereze dokita. Kasitoma bwe yakkiriza, obujanjabi buyingira mu queue y\'dokita.', sw: 'Wakati wa kuingizaji, mkaribishaji anamweka mgonjwa kwa daktari maalum au taaluma. Mara tu mkashia akiridhi, rekodi ya mgonjwa inaingia moja kwa moja kwenye foleni ya daktari huyo.', fr: 'Lors de l\'enregistrement, l\'accueil assigne le patient à un médecin ou une spécialité spécifique. Une fois validé par le caissier, le dossier du patient accède directement à la file de ce médecin assigné.' },
  faqDoctorReferral: { en: 'Can a Doctor refer a patient to another specialist or for surgery?', lg: 'Dokita ayinza okutuma omuntu ku mulala oba okukuba?', sw: 'Daktari anaweza kumrejeria mgonjwa kwa mtaalamu mwingine au kwa upasuaji?', fr: 'Un médecin peut-il référer un patient à un autre spécialiste ou pour une chirurgie ?' },
  faqDoctorReferralAnswer: { en: 'Yes. In the Doctor Consultation Workspace, doctors can issue referrals to specialist colleagues or surgical units. Referrals automatically generate corresponding billing items for the cashier.', lg: 'Yee. Mu workspace, dokita ayinza okutumira omuntu ku mulala. Okutuma kujja ne bill ku kasitoma.', sw: 'Ndio. Katika sehemu ya kazi ya daktari, madaktari wanaweza kutumia rejerali kwa wenzake wataalamu au vitengo vya upasuaji. Rejerali hutoa kiotomatiki vituo vya malipo kwa mkashia.', fr: 'Oui. Dans l\'espace de consultation du médecin, les médecins peuvent émettre des références vers des collègues spécialistes ou des unités chirurgicales. Les références génèrent automatiquement les éléments de facturation correspondants pour le caissier.' },
  faqWhereToSignIn: { en: 'Where do Ministry officials and Facility Admins sign in?', lg: 'Minisitule ne Ekisaawe bayingira tutya?', sw: 'Wizara na Menejimenti wa Kituo wanajia wapi?', fr: 'Où les responsables du Ministère et les Administrateurs d\'Établissement se connectent-ils ?' },
  faqWhereToSignInAnswer: { en: 'Dedicated separate portals are provided:\n• Ministry Control Center: /ministry/login\n• Facility Administration: /institution/login\n• Clinical Staff Workspace: /auth/login', lg: 'Portal ez\'ewunyolo:\n• Minisitule: /ministry/login\n• Ekisaawe: /institution/login\n• Abakabazi: /auth/login', sw: 'Portal mahususi zimetolewa:\n• Kituo cha Udhibiti wa Wizara: /ministry/login\n• Menejimenti ya Kituo: /institution/login\n• Sehemu ya Kazi ya Wafanyikazi: /auth/login', fr: 'Des portails séparés sont prévus :\n• Centre de Contrôle Ministériel : /ministry/login\n• Administration de l\'Établissement : /institution/login\n• Espace de Travail du Personnel Clinique : /auth/login' },
};

interface AppContextType extends AppState {
  isHydrated: boolean;
  setRole: (role: UserRole) => void;
  login: (role: UserRole, institutionId?: string, staffId?: string, staffName?: string) => void;
  logout: () => void;
  setActiveEpisode: (episodeId: string | null, patientId?: string | null) => void;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const defaultState: AppState = {
  role: null,
  institutionId: null,
  staffId: null,
  staffName: null,
  activeEpisodeId: null,
  activePatientId: null,
  language: 'en',
};

const STORAGE_KEY = 'medqr_auth_state';
const LANG_STORAGE_KEY = 'medqr_language';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((prev) => ({
          ...prev,
          role: parsed.role ?? null,
          institutionId: parsed.institutionId ?? null,
          staffId: parsed.staffId ?? null,
          staffName: parsed.staffName ?? null,
          activeEpisodeId: parsed.activeEpisodeId ?? null,
          activePatientId: parsed.activePatientId ?? null,
        }));
      }
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (savedLang && ['en', 'lg', 'sw', 'fr'].includes(savedLang)) {
        setState((prev) => ({ ...prev, language: savedLang }));
        document.documentElement.lang = savedLang;
      }
    } catch {
      // ignore corrupted storage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (hasLoggedOutRef.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isHydrated]);

  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

  const setRole = useCallback((role: UserRole) => {
    setState((prev: AppState) => ({ ...prev, role }));
  }, []);

  const login = useCallback((role: UserRole, institutionId?: string, staffId?: string, staffName?: string) => {
    const next = {
      role,
      institutionId: institutionId || null,
      staffId: staffId || null,
      staffName: staffName || null,
      activeEpisodeId: null,
      activePatientId: null,
      language: state.language,
    };
    setState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [state.language]);

  const logout = useCallback(() => {
    hasLoggedOutRef.current = true;
    setState(defaultState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LANG_STORAGE_KEY);
      void fetch('/api/auth/logout', { method: 'POST' }).finally(() => { window.location.replace('/'); });
    }
  }, []);

  const setActiveEpisode = useCallback((episodeId: string | null, patientId?: string | null) => {
    setState((prev: AppState) => ({ ...prev, activeEpisodeId: episodeId, activePatientId: patientId || null }));
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setState((prev) => ({ ...prev, language: lang }));
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[state.language] || entry.en || key;
  }, [state.language]);

  return (
    <AppContext.Provider value={{ ...state, isHydrated, setRole, login, logout, setActiveEpisode, changeLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

