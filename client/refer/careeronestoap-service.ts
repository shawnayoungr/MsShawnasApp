/**
 * CareerOneStop API Service
 * Provides access to official U.S. Department of Labor career data
 */

export interface OccupationDetails {
  OnetCode: string;
  OnetTitle: string;
  OnetDescription: string;
  TypicalEducation: string;
  BrightOutlook: string;
  CareerCluster: string;
  CareerPathway: string;
  GrowthRate: string;
  EducationTraining: {
    EducationType: Array<{
      EducationLevel: string;
      EducationDescription: string;
      Percentage: string;
    }>;
    TypicalEducation: string;
    WorkExperience: string;
    OnTheJobTraining: string;
  };
  Wages: {
    NationalWagesList: Array<{
      RateType: string;
      Pct10: string;
      Pct25: string;
      Median: string;
      Pct75: string;
      Pct90: string;
    }>;
  };
  RelatedOccupations: Array<{
    OnetCode: string;
    OnetTitle: string;
  }>;
  Skills: Array<{
    ElementName: string;
    DataValue: string;
  }>;
  Knowledge: Array<{
    ElementName: string;
    DataValue: string;
  }>;
  Abilities: Array<{
    ElementName: string;
    DataValue: string;
  }>;
}

export interface OccupationSearch {
  OnetCode: string;
  OnetTitle: string;
  Tags: string;
}

export interface JobListing {
  JobId: string;
  JobTitle: string;
  CompanyName: string;
  LocationName: string;
  JobDescription: string;
  Url: string;
  PostedDate: string;
  SalaryMin: string;
  SalaryMax: string;
}

export class CareerOneStopService {
  private userId: string;
  private token: string;
  private baseUrl = 'https://api.careeronestop.org';

  constructor(userId: string, token: string) {
    this.userId = userId;
    this.token = token;
  }

  /**
   * Get detailed occupation information by keyword
   */
  async getOccupationDetails(keyword: string, location: string = 'TX'): Promise<OccupationDetails[]> {
    try {
      // Use the Get Occupation Details endpoint with education training data
      const response = await fetch(
        `${this.baseUrl}/v1/occupation/${this.userId}/${keyword}/${location}?wages=true&skills=true&knowledge=true&ability=true&training=true`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`CareerOneStop API error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`CareerOneStop API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('CareerOneStop details response:', data);
      return data.OccupationDetail || [];
    } catch (error) {
      console.error('Error fetching occupation details:', error);
      return [];
    }
  }

  /**
   * Search occupations by keyword
   */
  async searchOccupations(keyword: string, location: string = 'TX'): Promise<OccupationSearch[]> {
    try {
      // Use the List Occupations by Keyword endpoint
      const response = await fetch(
        `${this.baseUrl}/v1/occupation/${this.userId}/${keyword}/N/0/20?datasettype=onet&searchby=title`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`CareerOneStop API error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`CareerOneStop API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('CareerOneStop search response:', data);
      
      // Transform the response to match our interface
      const occupations = data.OccupationList || [];
      return occupations.map((occupation: any) => ({
        OnetCode: occupation.OnetCode || '',
        OnetTitle: occupation.OnetTitle || '',
        Tags: occupation.OccupationDescription || ''
      }));
    } catch (error) {
      console.error('Error searching occupations:', error);
      return [];
    }
  }

  /**
   * Get salary information by occupation
   */
  async getSalaryInfo(keyword: string, location: string = 'TX') {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/comparesalaries/${this.userId}/wage?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`CareerOneStop Salary API error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`CareerOneStop API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('CareerOneStop salary response:', data);
      
      // Parse the salary data from the API response
      const wages = data.OccupationDetail?.Wages;
      if (wages) {
        // Prioritize Texas state wages over national wages for Texas-specific data
        const stateWages = wages.StateWagesList?.[0];
        const nationalWages = wages.NationalWagesList?.[0];
        const wageData = stateWages || nationalWages;
        
        if (wageData) {
          // Convert hourly wages to annual salaries (multiply by 2080 hours/year)
          const convertToAnnual = (hourlyWage: string) => {
            const hourly = parseFloat(hourlyWage);
            if (isNaN(hourly)) return hourlyWage;
            // If the value is already large (likely annual), return as-is
            if (hourly > 1000) return hourlyWage;
            // Otherwise convert hourly to annual (40 hours/week * 52 weeks = 2080 hours)
            return Math.round(hourly * 2080).toString();
          };

          return {
            median: convertToAnnual(wageData.Median),
            pct10: convertToAnnual(wageData.Pct10),
            pct25: convertToAnnual(wageData.Pct25),
            pct75: convertToAnnual(wageData.Pct75),
            pct90: convertToAnnual(wageData.Pct90),
            location: wageData.AreaName || (stateWages ? 'Texas' : 'National'),
            year: wages.WageYear
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching salary info:', error);
      return null;
    }
  }

  /**
   * Get labor market information by occupation
   */
  async getLaborMarketInfo(onetCode: string, location: string = 'TX') {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/lmi/${this.userId}/${onetCode}/${location}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CareerOneStop API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching labor market info:', error);
      return null;
    }
  }

  /**
   * Get job listings by occupation
   */
  async getJobListings(keyword: string, location: string = 'TX', radius: number = 25): Promise<JobListing[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/jobs/${this.userId}/${keyword}/${location}/${radius}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CareerOneStop API error: ${response.status}`);
      }

      const data = await response.json();
      return data.Jobs || [];
    } catch (error) {
      console.error('Error fetching job listings:', error);
      return [];
    }
  }

  /**
   * Get popular career clusters/categories
   */
  async getCareerClusters(): Promise<Array<{name: string, code: string, description: string}>> {
    // Career clusters from the Department of Education
    return [
      { name: 'Healthcare', code: '08', description: 'Medical, dental, and health services' },
      { name: 'Information Technology', code: '11', description: 'Computer systems, programming, and support' },
      { name: 'Business & Finance', code: '04', description: 'Management, marketing, and financial services' },
      { name: 'Engineering', code: '21', description: 'Design, development, and maintenance of systems' },
      { name: 'Education', code: '05', description: 'Teaching, training, and educational services' },
      { name: 'Science & Research', code: '15', description: 'Scientific research and development' },
      { name: 'Arts & Communication', code: '03', description: 'Creative and media production' },
      { name: 'Transportation', code: '16', description: 'Planning, management, and logistics' },
    ];
  }

  /**
   * Transform CareerOneStop data to our app format
   */
  transformToCareerData(occupation: OccupationDetails): any {
    const medianWage = occupation.Wages?.NationalWagesList?.[0]?.Median || 'Unknown';
    
    return {
      title: occupation.OnetTitle,
      description: occupation.OnetDescription,
      category: occupation.CareerCluster || 'General',
      salaryRange: `$${medianWage}`,
      education: occupation.TypicalEducation || 'Varies',
      growth: occupation.GrowthRate || 'Unknown',
      skills: occupation.Skills?.slice(0, 5).map(skill => skill.ElementName) || [],
      onetCode: occupation.OnetCode,
      brightOutlook: occupation.BrightOutlook === 'Yes',
    };
  }
}

export const careerOneStopService = process.env.CAREERONESTOAP_USER_ID && process.env.CAREERONESTOAP_TOKEN
  ? new CareerOneStopService(process.env.CAREERONESTOAP_USER_ID, process.env.CAREERONESTOAP_TOKEN)
  : null;