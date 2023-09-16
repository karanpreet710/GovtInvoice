import React, { useState } from "react";
import * as AppGeneral from "../socialcalc/AppGeneral";
import { File, Local } from "../storage/LocalStorage";
import { isPlatform, IonToast } from "@ionic/react";
import { Printer } from "@ionic-native/printer";
import { IonActionSheet, IonAlert } from "@ionic/react";
import { saveOutline, save, mail, print } from "ionicons/icons";
import { EmailComposer } from '@ionic-native/email-composer';
import { ref, uploadBytes, getStorage } from 'firebase/storage';
import firebaseApp from '../firebase'; // Import your Firebase configuration
import puppeteer from "puppeteer";

// Create a storage reference
const storage = getStorage(firebaseApp);

const Menu: React.FC<{
  showM: boolean;
  setM: Function;
  file: string;
  updateSelectedFile: Function;
  store: Local;
  bT: number;
}> = (props) => {
  const [showAlert1, setShowAlert1] = useState(false);
  const [showAlert2, setShowAlert2] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showToast1, setShowToast1] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  /* Utility functions */
  const _validateName = async (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage("Cannot update default file!");
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (await props.store._checkKey(filename)) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  const getCurrentFileName = () => {
    return props.file;
  };

  const _formatString = (filename) => {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };

  const doPrint = () => {
    if (isPlatform("hybrid")) {
      const printer = Printer;
      printer.print(AppGeneral.getCurrentHTMLContent());
    } else {
      const content = AppGeneral.getCurrentHTMLContent();
      var printWindow = window.open("", "", "left=100,top=100");
      printWindow.document.write(content);
      printWindow.print();
    }
  };

  const doSave = () => {
    if (props.file === "default") {
      setShowAlert1(true);
      return;
    }
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    const data = props.store._getFile(props.file);
    const file = new File(
      (data as any).created,
      new Date().toString(),
      content,
      props.file,
      props.bT
    );
    props.store._saveFile(file);
    props.updateSelectedFile(props.file);
    setShowAlert2(true);
  };

  const doSaveAs = async (filename) => {
    // event.preventDefault();
    if (filename) {
      // console.log(filename, _validateName(filename));
      if (await _validateName(filename)) {
        // filename valid . go on save
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        // console.log(content);
        const file = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename,
          props.bT
        );
        // const data = { created: file.created, modified: file.modified, content: file.content, password: file.password };
        // console.log(JSON.stringify(data));
        props.store._saveFile(file);
        props.updateSelectedFile(filename);
        setShowAlert4(true);
      } else {
        setShowToast1(true);
      }
    }
  };

  const sendEmail = async (emailType) => {
    if (isPlatform("hybrid")) {
      // const emailComposer = EmailComposer;
      // emailComposer.addAlias("gmail", "com.google.android.gm");
      try {
        if (emailType !== 'csv' && emailType !== 'html') {
          console.error('Invalid attachment type');
          return;
        }
  
        let attachmentData;
        let attachmentName;
  
        if (emailType === 'csv') {
          attachmentData = btoa(AppGeneral.getCSVContent()); // Assuming it's a string
          attachmentName = 'data.csv';
        } else if (emailType === 'html') {
          attachmentData = btoa(AppGeneral.getCurrentHTMLContent()); // Assuming it's a string
          attachmentName = 'report.html';
        }
  
        const email = {
          to: 'recipient@example.com',
          subject: 'Your Invoice',
          body: 'Please find the attachment',
          isHtml: false,
          attachments: [
            `base64:${attachmentName}//${attachmentData}`,
          ],
        };
  
        EmailComposer.open(email).then(() => {
          console.log('Email sent successfully with attachment');
        }).catch((error) => {
          console.error('Error sending email:', error);
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }
      // if (emailType === "html") {
      //   content = AppGeneral.getCurrentHTMLContent();
      // } else if (emailType === "csv") {
      //   // Generate CSV content using AppGeneral function
      //   content = AppGeneral.getCSVContent();
      // }
      // // then use alias when sending email
      // emailComposer.open({
      //   app: "mailto",
      //   to: "geetanshu2502@gmail.com",
      //   cc: "erika@mustermann.de",
      //   bcc: ["john@doe.com", "jane@doe.com"],
      //   attachments: [],
      //   subject: "Test mail",
      //   body: content,
      //   isHtml: true,
      // });
      // console.log("Hello bhai        - ", AppGeneral.getCurrentHTMLContent());
    } else {
      const mailgun = require("mailgun-js");
      const mg = mailgun({
        apiKey: "key-a128dfbe216c92500974c6d8ee1d4caa",
        domain: "sandbox9e26c52330b343b3bb63ff465a74f156.mailgun.org",
      });
      const data = {
        from: "Excited User <me@samples.mailgun.org>",
        to: "geetanshu2502@gmail.com",
        subject: "Test Mail",
        html: AppGeneral.getCurrentHTMLContent(),
      };
      mg.messages().send(data, function (error, body) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent successfully");
        }
      });
    }
  };

  const generateUniqueFileName = () => {
    const timestamp = new Date().getTime(); // Get the current timestamp
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string
    return `${timestamp}_${randomString}`;
  };

  async function convertHTMLtoPDF(htmlContent) {
    // Launch a headless Chrome browser
    const browser = await puppeteer.launch();
  
    try {
      // Open a new page
      const page = await browser.newPage();
  
      // Set the content of the page to your HTML content
      await page.setContent(htmlContent);
  
      // Generate a PDF from the page
      const pdfBuffer = await page.pdf({ format: 'A4' }); // Adjust the format as needed
  
      return pdfBuffer;
    } finally {
      // Close the browser when done
      await browser.close();
    }
  }

  const uploadToCloud = () => {
    const fileContent = AppGeneral.getCurrentHTMLContent();
    convertHTMLtoPDF(fileContent).then((pdfBuffer)=>{
      const fileName = generateUniqueFileName();
      const storagePath = 'pdfs/' + fileName + '.pdf';
      const storageRef = ref(storage, storagePath);
      uploadBytes(storageRef, pdfBuffer).then((snapshot) => {
        console.log('File uploaded successfully:', snapshot);
        setShowSuccessAlert(true);
      }).catch((error) => {
        console.error('Error uploading file:', error);
      });
    }).catch((error) => {
      console.error('Error generating PDF:', error);
    });
  };

  return (
    <React.Fragment>
      <IonActionSheet
        animated
        keyboardClose
        isOpen={props.showM}
        onDidDismiss={() => props.setM()}
        buttons={[
          {
            text: "Save",
            icon: saveOutline,
            handler: () => {
              doSave();
              console.log("Save clicked");
            },
          },
          {
            text: "Save As",
            icon: save,
            handler: () => {
              setShowAlert3(true);
              console.log("Save As clicked");
            },
          },
          {
            text: "Print",
            icon: print,
            handler: () => {
              doPrint();
              console.log("Print clicked");
            },
          },
          {
            text: "Send as HTML", // Option to send as HTML
            icon: mail,
            handler: () => {
              sendEmail("html");
              console.log("Send as HTML clicked");
            },
          },
          {
            text: "Send as CSV", // Option to send as CSV
            icon: mail,
            handler: () => {
              sendEmail("csv");
              console.log("Send as CSV clicked");
            },
          },
          {
            text: "Upload PDF to cloud", // Option to send as CSV
            icon: mail,
            handler: () => {
              uploadToCloud();
              console.log("Upload to cloud clicked");
            },
          }
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header='Alert Message'
        message={
          "Cannot update <strong>" + getCurrentFileName() + "</strong> file!"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert2}
        onDidDismiss={() => setShowAlert2(false)}
        header='Save'
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> updated successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert3}
        onDidDismiss={() => setShowAlert3(false)}
        header='Save As'
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: (alertData) => {
              doSaveAs(alertData.filename);
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert4}
        onDidDismiss={() => setShowAlert4(false)}
        header='Save As'
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> saved successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={() => setShowSuccessAlert(false)}
        header="Success"
        message="File uploaded successfully."
        buttons={['Ok']}
      />
      <IonToast
        animated
        isOpen={showToast1}
        onDidDismiss={() => {
          setShowToast1(false);
          setShowAlert3(true);
        }}
        position='bottom'
        message={toastMessage}
        duration={500}
      />
    </React.Fragment>
  );
};

export default Menu;
