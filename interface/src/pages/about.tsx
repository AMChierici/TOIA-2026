import toiaLogoVideo from "@/video/TOIA-LOGO-VID.mov";
import nyuad from "@/images/nyuad-rb.png";
import camel from "@/images/camel.png";
import alberto from "@/images/alberto.jpeg";
import tyeece from "@/images/Tyeece.jpg";
import wahib from "@/images/wahib.jpg";
import kertu from "@/images/kertu.jpg";
import armaan from "@/images/armaan.jpg";
import erin from "@/images/erin.jpeg";
import goffredo from "@/images/goffredo.jpeg";
import nizar from "@/images/nizar.jpg";
import sigdial from "@/pdf/SIGDIAL_2021_TOIA_camera_ready_.pdf";

const team = [
  { img: alberto, name: "Alberto Chierici" },
  { img: tyeece, name: "Tyeece Hensley" },
  { img: wahib, name: "Wahib Kamran" },
  { img: kertu, name: "Kertu Koss" },
  { img: armaan, name: "Armaan Agrawal" },
  { img: erin, name: "Erin Collins" },
  { img: goffredo, name: "Goffredo Puccetti" },
  { img: nizar, name: "Nizar Habash" },
];

const publications = [
  {
    text: "Alberto Chierici, Tyeece Hensley, Wahib Kamran, Kertu Koss, Armaan Agrawal, Erin Collins, Goffredo Puccetti and Nizar Habash. A Cloud-based User-Centered Time-Offset Interaction Application. SIGdial, April 2021.",
    links: [{ label: "PDF", href: sigdial }],
  },
  {
    text: "Nizar Habash and Alberto Chierici. A View From the Crowd: Evaluation Challenges for Time-Offset Interaction Applications. ACL, April 2021.",
    links: [
      { label: "PDF", href: "https://www.aclweb.org/anthology/2021.humeval-1.9.pdf" },
      { label: "BIB", href: "https://www.aclweb.org/anthology/2021.humeval-1.9.bib" },
    ],
  },
  {
    text: "Alberto Chierici, Nizar Habash, Margarita Bicec. The Margarita Dialogue Corpus: A Data Set for Time-Offset Interactions and Unstructured Dialogue Systems. LREC, May 2020.",
    links: [
      { label: "PDF", href: "https://www.aclweb.org/anthology/2020.lrec-1.60.pdf" },
      { label: "BIB", href: "https://www.aclweb.org/anthology/2020.lrec-1.60.bib" },
    ],
  },
  {
    text: "Dana Abu Ali, Muaz Ahmad, Hayat Al Hassan, Paula Dozsa, Ming Hu, Jose Varias, Nizar Habash. A Bilingual Interactive Human Avatar Dialogue System. SIGdial, July 2018.",
    links: [
      { label: "PDF", href: "https://www.aclweb.org/anthology/W18-5027.pdf" },
      { label: "BIB", href: "https://www.aclweb.org/anthology/W18-5027.bib" },
    ],
  },
];

export function AboutPage() {
  return (
    <div className="container max-w-4xl space-y-16 py-12">
      <section className="space-y-6 text-center">
        {/* The original animated TOIA logo from the old home page, kept small. */}
        <video
          src={toiaLogoVideo}
          className="mx-auto h-28 w-auto rounded-lg"
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={(e) => {
            e.currentTarget.playbackRate = 1.5;
          }}
        />
        <h1 className="text-3xl font-bold tracking-tight">TOIA — Communication Reimagined</h1>
        <div className="space-y-4 text-left text-muted-foreground">
          <p>
            Imagine being able to share your story with your great grandchildren. Imagine being able
            to interview for thousands of jobs simultaneously.
          </p>
          <p>
            TOIAs are interactive applications that allow communication across time and space. You can
            create an online stream from the comfort of your home and connect with millions of people,
            anywhere in the world, anytime in the future.
          </p>
          <p>
            TOIA is a project created at{" "}
            <a className="text-primary underline" href="https://nyuad.nyu.edu/en/">
              New York University Abu Dhabi's
            </a>{" "}
            <a
              className="text-primary underline"
              href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects/computational-approaches-to-modeling-language-lab.html"
            >
              CAMeL Lab
            </a>
            .
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">The TOIA Team</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-2 text-center">
              <img
                src={m.img}
                alt={m.name}
                className="size-24 rounded-full object-cover shadow-sm"
              />
              <span className="text-sm font-medium">{m.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Publications</h2>
        <ul className="space-y-4">
          {publications.map((p) => (
            <li key={p.text} className="text-sm text-muted-foreground">
              {p.text}{" "}
              {p.links.map((l) => (
                <a key={l.label} href={l.href} className="ml-1 text-primary underline">
                  [{l.label}]
                </a>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center gap-10">
        <a href="https://nyuad.nyu.edu/en/">
          <img src={nyuad} alt="NYU Abu Dhabi" className="h-16 w-auto" />
        </a>
        <a href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects/computational-approaches-to-modeling-language-lab.html">
          <img src={camel} alt="CAMeL Lab" className="h-16 w-auto" />
        </a>
      </section>
    </div>
  );
}
