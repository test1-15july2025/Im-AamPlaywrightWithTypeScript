import {Page} from "@playwright/test";
import { ImAamFunctionLibrary } from "./ImAamFunctionLibrary";
import ExcelJS from 'exceljs';


export class CommonFunctionLibrary {
    // private page: Page;
    page: Page;
    // iafl: ImAamFunctionLibrary;
    
    constructor(page: Page) {
        this.page = page;
        // this.iafl = new ImAamFunctionLibrary(this.page);
        // this.iafl.configTestFlow();
    }
    // public url: string;
    url: string = '';
    filePath: string = 'test-data/testData.xlsx';



    getTimestampManual(): string {
        const now = new Date();

        const dd = String(now.getDate()).padStart(2, '0');
        const MM = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const yyyy = String(now.getFullYear());
        
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        return `${dd}${MM}${yyyy}${HH}${mm}${ss}`;
    }



    async configTestFlow() {
        // const workbook = new ExcelJS.Workbook();
        // await workbook.xlsx.readFile(this.filePath);
        // const worksheet = workbook.getWorksheet('testFlow');
        // if (!worksheet) {
        //     throw new Error("Worksheet 'testFlow' not found in test-data/testData.xlsx");
        // }

        // // const urlCell = worksheet.getCell('A1').value;
        // const urlCell = worksheet.getCell('A1').value;
        // this.url = typeof urlCell === 'string' ? urlCell : String(urlCell || '');
        // if (!this.url) {
        //     throw new Error("Cell A1 in worksheet 'testFlow' does not contain a valid URL.");
        // }

        this.url = await this.getFirstRowValueByHeader('testFlow', 'Environment URL');


        // console.log('URL from Excel:', this.url);
        // await this.page.goto(this.url);

        // await this.page.click('text=Accept All Cookies');
        // await this.page.click('text=Get Started');
    }


    async getFirstRowValueByHeader(sheetName: string, columnName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);
    
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(`Worksheet with name "${sheetName}" not found.`);
    }

    // Row 1 is typically the Header row
    const headerRow = worksheet.getRow(1);
    let targetColumnIndex = -1;

    // Find the column index that matches your column name
    headerRow.eachCell((cell, colNumber) => {
      if (cell.text.trim() === columnName.trim()) {
        targetColumnIndex = colNumber;
      }
    });

    if (targetColumnIndex === -1) {
      throw new Error(`Column "${columnName}" not found in sheet "${sheetName}".`);
    }

    // Row 2 is the first row of actual data
    const firstDataRow = worksheet.getRow(2);
    const cellValue = firstDataRow.getCell(targetColumnIndex).text;

    return cellValue || '';
  }

  // async logIn(userName:string, password:string) {
  //   await this.page.goto(this.iafl.url);
  //   await this.page.getByText('Login').click();
  //   await this.page.getByPlaceholder('Enter your username or email').fill(userName);
  //   await this.page.getByPlaceholder('Enter Password').fill(password);
  //   await this.page.locator("button:has-text('Login')").click();
  //   await this.page.waitForLoadState('load');
  // }
}