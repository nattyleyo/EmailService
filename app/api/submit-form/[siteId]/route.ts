import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import mustache from "mustache";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";

// MongoDB connection URI and database
const mongoUrl: string = process.env.MONGO_URI || "";
const client = new MongoClient(mongoUrl);

type DataType = {
  formName: string;
  formData: Record<string, any>;
};

// Function to parse form data based on content type
async function parseRequestBody(req: Request): Promise<DataType | null> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await req.json();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    const obj: Record<string, any> = {};

    formData.forEach((value, key) => {
      obj[key] = value;
    });

    return {
      formName: obj.formName || "",
      formData: obj.formData ? JSON.parse(obj.formData) : {},
    };
  }

  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const body: DataType | null = await parseRequestBody(req);
    if (!body) {
      return NextResponse.json(
        { message: "Unsupported content type" },
        { status: 400 }
      );
    }

    const { formName, formData } = body;
    const siteId = (await params).siteId;

    // console.log("iddd", siteId);
    // console.log("formName", formName);
    // console.log("formData", formData);
    // console.log("formData-name", formData.name);

    if (!formName || !formData || !siteId) {
      return NextResponse.json(
        { message: "formName, formData, and siteId are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB and fetch site-specific config
    await client.connect();
    const database = client.db("siteConfig");
    const sitesCollection = database.collection("sites");

    // Fetch site-specific config from MongoDB
    const siteConfig = await sitesCollection.findOne({
      _id: new ObjectId(siteId),
    });

    if (!siteConfig) {
      return NextResponse.json(
        { message: "Site configuration not found" },
        { status: 404 }
      );
    }

    const { siteName, teamEmail, appEmail, appPass, emailTemplate } =
      siteConfig;

    // Generate HTML content from formData
    let htmlContent = Object.entries(formData)
      .map(
        ([key, value]) =>
          `<strong>${
            key.charAt(0).toUpperCase() + key.slice(1)
          }:</strong> ${value}<br/>`
      )
      .join("");

    // Render email using Mustache
    const emailRender = mustache.render(emailTemplate, {
      siteName,
      formName,
      formData,
      htmlContent,
    });

    // Setup Nodemailer transporter with Gmail OAuth2 (optional)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: appEmail,
        pass: appPass,
      },
    });

    // Email options
    const mailOptions = {
      from: `${siteName} <${appEmail}>`,
      to: teamEmail,
      subject: `New Form Submission - ${formName}`,
      html: emailRender,
    };

    // Send email
    // await transporter.sendMail(mailOptions);

    return NextResponse.json(
      {
        message: "Form submitted successfully, email sent to team",
        data: formData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
