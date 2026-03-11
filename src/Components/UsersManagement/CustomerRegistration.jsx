import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ArrowLeft, Building2, UserRound } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { app, secondaryAuth } from "../Auth/firebase";

const db = getFirestore(app);

const initialForm = {
  companyName: "",
  contactName: "",
  contactRole: "",
  businessEmail: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  nin: "",
  companyRegistrationNumber: "",
  taxId: "",
  industry: "",
  companySize: "",
  state: "",
  lga: "",
  website: "",
  notes: "",
};

const accountTypeMeta = {
  business: {
    title: "Business Account Registration",
    description: "Create a company customer account and assign a primary contact.",
    icon: Building2,
    submitLabel: "Create Business Account",
  },
  individual: {
    title: "Individual Account Registration",
    description: "Register a personal customer account for one customer profile.",
    icon: UserRound,
    submitLabel: "Create Individual Account",
  },
};

const industryOptions = [
  "Agriculture",
  "Automotive",
  "Aviation",
  "Banking and Finance",
  "Construction",
  "Consumer Goods",
  "Education",
  "Energy and Utilities",
  "Entertainment and Media",
  "Fashion and Apparel",
  "Food and Beverage",
  "Freight and Logistics",
  "Government and Public Sector",
  "Healthcare",
  "Hospitality and Tourism",
  "Information Technology",
  "Insurance",
  "Legal Services",
  "Manufacturing",
  "Marine and Shipping",
  "Mining",
  "Nonprofit",
  "Oil and Gas",
  "Pharmaceuticals",
  "Professional Services",
  "Real Estate",
  "Retail and Ecommerce",
  "Telecommunications",
  "Transportation",
  "Warehousing",
  "Other",
];

const companyRoleOptions = [
  "Account Manager",
  "General Manager",
  "Operations Manager",
  "Procurement Manager",
  "Project Manager",
  "Sales Manager",
  "Supply Chain Manager",
  "Other",
];

const nigeriaLocations = {
  Abia: ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Umuahia North", "Umuahia South", "Ugwunagbo"],
  Adamawa: ["Demsa", "Fufore", "Ganye", "Girei", "Gombi", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo-Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  "Akwa Ibom": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Itu", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  Anambra: ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  Bauchi: ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  Bayelsa: ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  Benue: ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  Borno: ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  "Cross River": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  Delta: ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  Ebonyi: ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  Edo: ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba-Okha", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  Ekiti: ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  Enugu: ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
  FCT: ["Abaji", "Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
  Gombe: ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  Imo: ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"],
  Jigawa: ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  Kaduna: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  Kano: ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  Katsina: ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  Kebbi: ["Aleiro", "Argungu", "Arewa Dandi", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
  Kogi: ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  Kwara: ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  Lagos: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  Nasarawa: ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  Niger: ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  Ogun: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu"],
  Ondo: ["Akoko North-East", "Akoko North-West", "Akoko South-West", "Akoko South-East", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  Osun: ["Aiyedire", "Atakunmosa East", "Atakunmosa West", "Ayedaade", "Ayedire", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  Oyo: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  Plateau: ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  Rivers: ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emohua", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  Sokoto: ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  Taraba: ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  Yobe: ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  Zamfara: ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Chafe", "Zurmi"],
};

const nigeriaStates = Object.keys(nigeriaLocations);

const normalizeWebsite = (value) => {
  const website = value.trim();
  if (!website) return "";
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
};

const normalizePhone = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
};

const isValidPhone = (value) => /^\+?[1-9]\d{7,14}$/.test(value);

const CustomerRegistration = () => {
  const navigate = useNavigate();
  const { accountType } = useParams();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const config = accountTypeMeta[accountType];
  const isBusinessAccount = accountType === "business";

  if (!config) {
    return <Navigate to="/customers-onboard" replace />;
  }

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { lga: "" } : {}),
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const loginEmail = (isBusinessAccount ? form.businessEmail : form.email).trim().toLowerCase();
      const trimmedCompanyName = form.companyName.trim();
      const trimmedContactName = form.contactName.trim();
      const trimmedContactRole = form.contactRole.trim();
      const trimmedPhone = normalizePhone(form.phone);
      const trimmedState = form.state.trim();
      const trimmedLga = form.lga.trim();
      const trimmedAddress = form.address.trim();
      const trimmedNin = form.nin.trim();
      const trimmedNotes = form.notes.trim();
      const trimmedIndustry = form.industry.trim();
      const trimmedCompanyRegistrationNumber = form.companyRegistrationNumber.trim();
      const trimmedTaxId = form.taxId.trim();
      const trimmedCompanySize = form.companySize.trim();
      const normalizedWebsite = normalizeWebsite(form.website);
      const customerName = isBusinessAccount
        ? trimmedCompanyName
        : trimmedContactName;
      const primaryEmail = isBusinessAccount ? loginEmail : form.email.trim().toLowerCase();
      const resolvedAddress = isBusinessAccount
        ? [trimmedAddress, trimmedLga, trimmedState, "Nigeria"].filter(Boolean).join(", ")
        : trimmedAddress;

      if (form.password.length < 6) {
        const message = "Password must be at least 6 characters.";
        setError(message);
        toast.info(message);
        return;
      }

      if (form.password !== form.confirmPassword) {
        const message = "Passwords do not match.";
        setError(message);
        toast.info(message);
        return;
      }

      if (!isValidPhone(trimmedPhone)) {
        const message = "Enter a valid phone number in international format.";
        setError(message);
        toast.info(message);
        return;
      }

      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        loginEmail,
        form.password,
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        email: loginEmail,
        role: "opsuser",
        fullName: trimmedContactName,
        name: trimmedContactName,
        accountType,
        companyName: isBusinessAccount ? trimmedCompanyName : "",
        contactRole: isBusinessAccount ? trimmedContactRole : "",
        phone: trimmedPhone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        console.warn("Failed to send verification email on customer signup:", verificationError);
      }

      const customerPayload = {
        uid: credential.user.uid,
        accountType,
        companyName: customerName,
        contactName: trimmedContactName,
        contactRole: trimmedContactRole,
        email: primaryEmail,
        businessEmail: isBusinessAccount ? loginEmail : "",
        phone: trimmedPhone,
        address: resolvedAddress,
        state: isBusinessAccount ? trimmedState : "",
        lga: isBusinessAccount ? trimmedLga : "",
        nin: isBusinessAccount ? "" : trimmedNin,
        companyRegistrationNumber: isBusinessAccount ? trimmedCompanyRegistrationNumber : "",
        taxId: isBusinessAccount ? trimmedTaxId : "",
        industry: isBusinessAccount ? trimmedIndustry : "",
        companySize: isBusinessAccount ? trimmedCompanySize : "",
        website: isBusinessAccount ? normalizedWebsite : "",
        notes: trimmedNotes,
        status: "active",
        emailVerified: false,
        phoneVerified: false,
        verification: {
          email: {
            status: "sent",
            required: true,
            sentAt: serverTimestamp(),
          },
          phone: {
            status: "pending",
            required: true,
            method: "manual-review",
          },
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isBusinessAccount) {
        customerPayload.businessProfile = {
          legalName: trimmedCompanyName,
          registrationNumber: trimmedCompanyRegistrationNumber,
          taxId: trimmedTaxId,
          industry: trimmedIndustry,
          companySize: trimmedCompanySize,
          website: normalizedWebsite,
          primaryContact: {
            name: trimmedContactName,
            role: trimmedContactRole,
            email: loginEmail,
            phone: trimmedPhone,
          },
          address: {
            street: trimmedAddress,
            lga: trimmedLga,
            state: trimmedState,
            country: "Nigeria",
          },
        };
      }

      await setDoc(doc(db, "customers", credential.user.uid), {
        ...customerPayload,
      });

      setSuccess("Customer onboarded successfully.");
      setForm(initialForm);
      await signOut(secondaryAuth);
      toast.success("Customer onboarded. Verification email has been sent.");
      navigate("/login", { replace: true });
    } catch (submitError) {
      if (submitError?.code === "auth/email-already-in-use") {
        toast.info("Account already exists. Please login.");
        navigate("/login", { replace: true });
        return;
      }

      const message = submitError?.message || "Failed to onboard customer.";
      setError(message);
      toast.error(message);
    } finally {
      if (secondaryAuth.currentUser) {
        try {
          await signOut(secondaryAuth);
        } catch (signOutError) {
          console.warn("Failed to clear secondary auth session:", signOutError);
        }
      }
      setLoading(false);
    }
  };

  const Icon = config.icon;
  const stateOptions = isBusinessAccount ? nigeriaStates : [];
  const lgaOptions = isBusinessAccount && form.state ? nigeriaLocations[form.state] || [] : [];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/customers-onboard")}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Change Account Type
        </button>

        <header className="mb-8 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-400">
            <Icon size={28} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {config.title}
            </h1>
            <p className="mt-2 text-slate-400">
              {config.description}
            </p>
            <p className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
              Email verification is sent automatically after registration. Phone verification is recorded as pending until it is confirmed by operations.
            </p>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7"
        >
          {isBusinessAccount ? (
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Capture the company identity and the primary business contact.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Company Name
                  </span>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Acme Logistics Ltd"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Industry
                  </span>
                  <select
                    name="industry"
                    value={form.industry}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Registration Number
                  </span>
                  <input
                    name="companyRegistrationNumber"
                    value={form.companyRegistrationNumber}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="RC-123456"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Tax ID
                  </span>
                  <input
                    name="taxId"
                    value={form.taxId}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="TIN-908765"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Company Size
                  </span>
                  <select
                    name="companySize"
                    value={form.companySize}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Website
                  </span>
                  <input
                    name="website"
                    value={form.website}
                    onChange={onChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="https://acmelogistics.com"
                  />
                </label>
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isBusinessAccount ? (
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Contact Person
                </span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="Jane Doe"
                />
              </label>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3">
                <p className="text-sm font-medium text-slate-200">Individual account selected</p>
                <p className="mt-1 text-sm text-slate-400">
                  The customer&apos;s full name will be used as the primary account name.
                </p>
              </div>
            )}

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {isBusinessAccount ? "Contact Role" : "Full Name"}
              </span>
              {isBusinessAccount ? (
                <select
                  name="contactRole"
                  value={form.contactRole}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="">Select contact role</option>
                  {companyRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="John Doe"
                />
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {isBusinessAccount ? "Business Email" : "Email"}
              </span>
              <input
                type="email"
                name={isBusinessAccount ? "businessEmail" : "email"}
                value={isBusinessAccount ? form.businessEmail : form.email}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder={isBusinessAccount ? "procurement@acme.com" : "johndoe@example.com"}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Phone</span>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="+15550100"
              />
            </label>
          </div>

          {isBusinessAccount ? (
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Company Address</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Capture the Nigerian state, LGA, and street address for the business.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    State
                  </span>
                  <select
                    name="state"
                    value={form.state}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select state</option>
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    LGA
                  </span>
                  <select
                    name="lga"
                    value={form.lga}
                    onChange={onChange}
                    required
                    disabled={!form.state}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{form.state ? "Select LGA" : "Select state first"}</option>
                    {lgaOptions.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Street Address
                </span>
                <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="12 Industrial Estate Road"
                />
              </label>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Minimum 6 characters"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Confirm Password
              </span>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Re-enter password"
              />
            </label>
          </div>

          {!isBusinessAccount ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Address</span>
                <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="123 Operations Blvd, Dallas, TX"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  NIN (Optional)
                </span>
                <input
                  name="nin"
                  value={form.nin}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="12345678901"
                />
              </label>
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {isBusinessAccount ? "Operational Notes" : "Notes"}
            </span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="Any special handling requirements..."
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-600 px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-orange-700 disabled:opacity-70 sm:w-auto"
          >
            {loading ? "Saving..." : config.submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegistration;
