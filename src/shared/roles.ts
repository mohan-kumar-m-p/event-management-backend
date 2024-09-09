export enum OrganizerRole {
  Admin = 'admin',
  MeetManager = 'meetManager',
  RegistrationInCharge = 'registrationInCharge',
  Warden = 'warden',
  AccountsManager = 'accountsManager',
  CulturalProgramCoordinator = 'culturalProgramCoordinator',
  MessManager = 'messManager',
}

export enum SchoolRole {
  School = 'school',
  Manager = 'manager',
  Coach = 'coach',
  Athlete = 'athlete',
}

// meetManager can do all inField activities
// registrationInCharge can do all CRUD operations for athlete manager coach
// warden can do all CRUD for accomondations
// culturalProgramCoordinator can do all CRUD for culturalPrograms

