import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import mustache from "mustache";

type DataType = {
  formName: string;
  formData: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const body: DataType = await req.json();
    const { formName, formData } = body;

    if (!formName || !formData) {
      return NextResponse.json(
        { message: "formName and formData are required" },
        { status: 400 }
      );
    }

    // Load environment variables
    const siteName = process.env.SITE_NAME || "";
    const teamEmail = process.env.TEAM_EMAIL || "";
    const appEmail = process.env.APP_EMAIL || "";
    const appPass = process.env.APP_PASS || "";
    const emailTemplate = process.env.EMAIL_TEMPLATE || "";

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

    // Setup Nodemailer transporter
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
    await transporter.sendMail(mailOptions);

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
  }
}
