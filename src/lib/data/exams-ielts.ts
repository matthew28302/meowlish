import { ExamSet } from './exams';

// ============================================================================
// BỘ ĐỀ IELTS ACADEMIC — ĐỀ MẪU CHÍNH THỨC (ielts.org / British Council / IDP / Cambridge)
// Nguồn: ielts.org sample test questions (computer-delivered samples) + speaking sample 2023.
// Gồm: Listening 30 câu (7 dạng task, kèm transcript + đáp án chuẩn),
//       Academic Reading 43 câu (10 dạng task trên 10 bài đọc, đáp án chuẩn),
//       Writing 2 task (biểu đồ + essay, có bài mẫu và nhận xét giám khảo),
//       Speaking 3 phần (có transcript mẫu).
// Ghi chú: dạng Plan/Map/Diagram Labelling cần hình bản đồ nên không đưa vào bản số hóa này.
// ============================================================================

// ===== TRANSCRIPTS (nguyên văn tapescript chính thức) =====

const T_NOTE = `M: Oh well, there were two ads actually. Was it the one for second-hand furniture?

F: That's right, yes. Last Thursday…

M: Oh yes… Some of it's already gone I'm afraid, but… what exactly were you interested in?

F: Mainly the dining room furniture, specially the table. Has that gone yet?

M: Not yet.

F: Oh good. Can you tell me a bit about it?

M: Well, it's round. I'm not sure of the exact measurements, but it's medium sized. It seats about six.

F: And how old is it?

M: Mmmm. Mm let's see…ten years? No it must be twelve by now.

F: And the advertisement said you were asking £25 for that?

M: That's right.

F: And do you still have the dining chairs?

M: Yes. It's a set of four chairs – there were two more but over the years a couple have disappeared.

F: What are they like?

M: Quite nice – they've got upholstered seats – you know they're covered in material to make them more comfortable to sit on. That's green – but you could change it of course, if you wanted something different.

F: What sort of condition are they in?

M: I'd say reasonable – they've had a bit of wear. And we're asking £20 for those.

F: Right. And the other thing I wanted to ask about was the desk. Can you tell me roughly how long the top is, so I know if it'll fit in my room?

M: Let's see…It's 75 cm high I know, and the length's er r 1 metre 20. And it's 40 cm deep. It's got 3 drawers – the top one's got a lock so you can keep your valuables there.

F: And you were asking £50.00 for that?

M: Yes, it's a bit more because it's in good condition. But if you want to take the other things too, I could let you have it for forty.`;

const T_MC1 = `M1: Right, Judy, this week it's your turn to bring us up to date on your dissertation. So?

F1: I've finished the basic research and planning, and the first draft, and hopefully I can start writing the final version now.

M1: Good. Not everyone knows your subject, so you'd better introduce it.

F1: Oh, I've chosen to study everyday life in the East End of London in the early twentieth century. Lots of books have been published about the East End, covering everything from health to how roads and districts got their names, so you might think it's an obvious subject to pick. But in fact I was brought up there, and I've always been interested in finding out how the area shaped my upbringing.

F2: What materials did you use in your research?

F1: As I said, a lot's been written about the area, and I used some of it to get an idea of what to cover. But the bulk of my work is based on the elderly people from the area who I managed to contact and arrange to meet, and then recorded as they talked to me. And when they referred to any specific events, I looked them up in local newspapers from the time.

M2: Was it difficult to get enough source material?

F1: Not a bit. The problems started when I thought I had enough material, and sat down to devise a workable filing system. It took ages, but I was really glad of it when I came to writing the draft; otherwise it would have been impossible.`;

const T_MCLIB = `M: And we also hold regular events at the library.

F: Do I have to book for any of the events?

M: No, that's not necessary. When you come into the library, do make sure you pick up a copy of the Guide to the Library. Of course, anything you need to know, such as how the catalogue system works, you can ask any member of staff, but the Guide does contain basic information about our services. It doesn't include things like the special events because they always change, but inside you'll find a plan of the library, showing where, for example, the reading room is. It also tells you about our café in the basement, though that's not open at the moment because of building work we're having done to install disabled lifts. Oh, and if you can't find what you want on the shelf, there's a section about how to reserve books that tells you what you need to do.

F: Thanks, I'll remember to collect that when…`;

const T_TABLE = `You will hear part of a talk about research into 'learner persistence' given by a university lecturer to her colleagues.

The second section of my questionnaire looked at learner persistence under three main headings: social and environmental factors, other factors, and intrinsic or personal characteristics. I identified three levels of importance for each of these. At the first level – those points identified by participants as most important in learner persistence – for social factors, many respondents said how crucial it had been to have good support, though there was no one specific source; it could be family or friends. As regards other factors, students are heartened not so much by high grades but by what they regard as success in study. And for personal characteristics, many respondents reported that they took pleasure in challenge and that this was regarded as very significant.

At the second level of importance, in the first category, a sizeable percentage talked about the fact that they had enjoyed themselves in school as an important social factor. In the second column, other factors, a number of people said that what was of most importance was decent health – this had a fairly strong influence on their persistence in their studies. And then under the heading of personal characteristics, there were quite a large percentage of respondents who mentioned they felt it was important to have lots of interests in their everyday lives. This gave them a depth and sense of perspective which less persistent learners might lack.

And then onto the third level. Under social factors, several respondents talked about good relationships with their tutors. For other factors, they mentioned lack or absence of any problems in their families. And finally under column three, they identified an ability to juggle several roles – what we might call their capacity for multi-tasking.`;

const T_SENT = `Paul: The other thing I wanted to ask you was, did you find it hard, studying with the Open University?

Rachel: You mean, because you're studying on your own, most of the time?

Paul: Mm.

Rachel: Well, it took me a while to get used to it. I found I needed to maintain a high level of motivation because it's so different from school. There's no-one saying, 'Why haven't you written your assignment yet?' and that sort of thing.

Paul: Oh dear.

Rachel: You'll learn it, Paul. Another thing was that I got very good at time-management because I had to fit time for studying round a full-time job.

Paul: Well, I'm hoping to change to working part-time, so that'll help.

Rachel: What makes it easier is that the degree is made up of modules, so you can take time off between them if you need to. It isn't like a traditional three- or four-year course, where you've got to do the whole thing of it in one go.

Paul: That's good, because I'd like to spend six months travelling next year.

Rachel: Huh, it's all right for some. Then even though you're mostly studying at home, remember you've got tutors to help you, and from time to time there are summer schools. They usually last a week. They're great because you meet all the other people struggling with the same things as you. I've made some really good friends that way.

Paul: Sounds good. So how do I apply?`;

const T_FLOW = `You will hear two biology students comparing their research on evidence of life on Earth and other planets.

A: So we've talked about how we find evidence of past life on earth, and in the second part of our presentation, we want to demonstrate in a practical way how to find out if there has ever been life on other planets in the solar system.

B: Yes, and I thought we could present the information in the form of a flowchart.

A: Great idea. So, the procedure begins by sending a spacecraft to land on the planet.

B: Right, then a vehicle, called a rover, is sent out from the spacecraft. This is a small machine which travels over the planet. The rover needs to find a good range of organic material so they direct it to a site that's likely to provide this. Then the rover drills down under the surface to collect a sample.

A: Why does the sample have to come from underneath? Why not just scoop up some soil from the top? Is it to stop contamination from the rover? I've heard that can be a problem.

B: No, the rover is clean. It's actually because of the atmosphere. Unlike our planet, the surface might be exposed to high levels of radiation and that could kill anything living on the surface.

A: I see. But something could still be present underneath the surface.

B: Yes. It's possible.

A: So at this point the soil and rocks that have been collected would need to be analysed, to see if there are any signs of fossils.

B: Right. Just as we do on Earth. It's unlikely that there'd be anything that large, but it's an essential step.

A: Yes.

B: Once that's been done, the sample is crushed into a fine powder.

A: Why is that? Doesn't that destroy everything?

B: Well, luckily, no. And in the next stage of the analysis, the sample has to be exposed to heat, and then run through a mass spectrometer.

A: We'll need to explain that this is an instrument used to measure the weight and concentration of atoms and molecules.

B: Yes. This level of analysis is necessary to search for microscopic signs of life, much smaller than fossils, such as microbes.

A: So once all this has been done and the results sent back to Earth, what happens next? Can they do anything with the results?

B: Yes. They can compare them with data from similar studies done on large bodies of water or desert soils from Earth.

A: Fascinating. Let's make a start on our presentation slides, shall we?`;

const T_SA = `Good afternoon everybody and thank you for giving me your time today. Firstly I'd like to talk to you about a career in the fashion industry, then about the kind of people we're looking for at Pacific Clothing, and finally I'd like to tell you what we offer you if you come to work for us.

All kinds of people work in a wide range of jobs in the clothing industry, from drivers to office workers and artists. At the moment we're looking to recruit new staff from several professions. Right now we're on the lookout for scientists, particularly to work with the dyes we use to colour fabrics. And to design the patterns and choose the colours which are going to appeal to consumers, we have a strong design team. We're not looking for any new designers at present but vacancies may arise in future. However, at the moment we are looking for engineers to work in the production department. Just like any company, we too need practically-minded people to make sure that we're not spending more than we're earning, so we're currently recruiting accountants. They're not usually associated with fashion but let me tell you, they perform a vital task. But that's not to say that, if you have qualifications in another field, such as management or sales, we won't be needing someone like you in the future.`;

// ===== READING PASSAGES (nguyên văn bài đọc mẫu chính thức) =====

const R_MARIE = `The life and work of Marie Curie

Marie Curie is probably the most famous woman scientist who has ever lived. Born Maria Sklodowska in Poland in 1867, she is famous for her work on radioactivity, and was twice a winner of the Nobel Prize. With her husband, Pierre Curie, and Henri Becquerel, she was awarded the 1903 Nobel Prize for Physics, and was then sole winner of the 1911 Nobel Prize for Chemistry. She was the first woman to win a Nobel Prize.

From childhood, Marie was remarkable for her prodigious memory, and at the age of 16 won a gold medal on completion of her secondary education. Because her father lost his savings through bad investment, she then had to take work as a teacher. From her earnings she was able to finance her sister Bronia's medical studies in Paris, on the understanding that Bronia would, in turn, later help her to get an education.

In 1891 this promise was fulfilled and Marie went to Paris and began to study at the Sorbonne (the University of Paris). She often worked far into the night and lived on little more than bread and butter and tea. She came first in the examination in the physical sciences in 1893, and in 1894 was placed second in the examination in mathematical sciences. It was not until the spring of that year that she was introduced to Pierre Curie.

The marriage of Pierre and Marie Curie in 1895 marked the start of a partnership that was soon to achieve results of world significance. Following Henri Becquerel's discovery in 1896 of a new phenomenon, which Marie later called 'radioactivity', Marie Curie decided to find out if the radioactivity discovered in uranium was to be found in other elements. She discovered that this was true for thorium.

Turning her attention to minerals, she found her interest drawn to pitchblende, a mineral whose radioactivity, superior to that of pure uranium, could be explained only by the presence in the ore of small quantities of an unknown substance of very high activity. Pierre Curie joined her in the work that she had undertaken to resolve this problem, and that led to the discovery of the new elements, polonium and radium. While Pierre Curie devoted himself chiefly to the physical study of the new radiations, Marie Curie struggled to obtain pure radium in the metallic state. This was achieved with the help of the chemist André-Louis Debierne, one of Pierre Curie's pupils. Based on the results of this research, Marie Curie received her Doctorate of Science, and in 1903 Marie and Pierre shared with Becquerel the Nobel Prize for Physics for the discovery of radioactivity.

The births of Marie's two daughters, Irène and Eve, in 1897 and 1904 failed to interrupt her scientific work. She was appointed lecturer in physics at the École Normale Supérieure for girls in Sèvres, France (1900), and introduced a method of teaching based on experimental demonstrations. In December 1904 she was appointed chief assistant in the laboratory directed by Pierre Curie.

The sudden death of her husband in 1906 was a bitter blow to Marie Curie, but was also a turning point in her career: henceforth she was to devote all her energy to completing alone the scientific work that they had undertaken. On May 13, 1906, she was appointed to the professorship that had been left vacant on her husband's death, becoming the first woman to teach at the Sorbonne. In 1911 she was awarded the Nobel Prize for Chemistry for the isolation of a pure form of radium.

During World War I, Marie Curie, with the help of her daughter Irène, devoted herself to the development of the use of X-radiography, including the mobile units which came to be known as 'Little Curies', used for the treatment of wounded soldiers. In 1918 the Radium Institute, whose staff Irène had joined, began to operate in earnest, and became a centre for nuclear physics and chemistry. Marie Curie, now at the highest point of her fame and, from 1922, a member of the Academy of Medicine, researched the chemistry of radioactive substances and their medical applications.

In 1921, accompanied by her two daughters, Marie Curie made a triumphant journey to the United States to raise funds for research on radium. Women there presented her with a gram of radium for her campaign. Marie also gave lectures in Belgium, Brazil, Spain and Czechoslovakia and, in addition, had the satisfaction of seeing the development of the Curie Foundation in Paris, and the inauguration in 1932 in Warsaw of the Radium Institute, where her sister Bronia became director.

One of Marie Curie's outstanding achievements was to have understood the need to accumulate intense radioactive sources, not only to treat illness but also to maintain an abundant supply for research. The existence in Paris at the Radium Institute of a stock of 1.5 grams of radium made a decisive contribution to the success of the experiments undertaken in the years around 1930. This work prepared the way for the discovery of the neutron by Sir James Chadwick and, above all, for the discovery in 1934 by Irène and Frédéric Joliot-Curie of artificial radioactivity. A few months after this discovery, Marie Curie died as a result of leukaemia caused by exposure to radiation. She had often carried test tubes containing radioactive isotopes in her pocket, remarking on the pretty blue-green light they gave off.

Her contribution to physics had been immense, not only in her own work, the importance of which had been demonstrated by her two Nobel Prizes, but because of her influence on subsequent generations of nuclear physicists and chemists.`;

const R_GREY1 = `The general assumption is that older workers are paid more in spite of, rather than because of, their productivity. That might partly explain why, when employers are under pressure to cut costs, they persuade a 55-year old to take early retirement. Take away seniority-based pay scales, and older workers may become a much more attractive employment proposition. But most employers and many workers are uncomfortable with the idea of reducing someone's pay in later life – although manual workers on piece-rates often earn less as they get older. So retaining the services of older workers may mean employing them in different ways.

One innovation was devised by IBM Belgium. Faced with the need to cut staff costs, and having decided to concentrate cuts on 55 to 60-year olds, IBM set up a separate company called Skill Team, which re-employed any of the early retired who wanted to go on working up to the age of 60. An employee who joined Skill Team at the age of 55 on a five-year contract would work for 58% of his time, over the full period, for 88% of his last IBM salary. The company offered services to IBM, thus allowing it to retain access to some of the intellectual capital it would otherwise have lost.

The best way to tempt the old to go on working may be to build on such 'bridge' jobs: part-time or temporary employment that creates a more gradual transition from full-time work to retirement. Studies have found that, in the United States, nearly half of all men and women who had been in full-time jobs in middle age moved into such 'bridge' jobs at the end of their working lives. In general, it is the best-paid and worst-paid who carry on working. There seem to be two very different types of bridge job-holder – those who continue working because they have to and those who continue working because they want to, even though they could afford to retire.

If the job market grows more flexible, the old may find more jobs that suit them. Often, they will be self-employed. Sometimes, they may start their own businesses: a study by David Storey of Warwick University found that in Britain 70% of businesses started by people over 55 survived, compared with an overall national average of only 19%. But whatever pattern of employment they choose, in the coming years the skills of these 'grey workers' will have to be increasingly acknowledged and rewarded.`;

const R_GREY2 = `Clearly, when older people do heavy physical work, their age may affect their productivity. But other skills may increase with age, including many that are crucial for good management, such as an ability to handle people diplomatically, to run a meeting or to spot a problem before it blows up. Peter Hicks, who co-ordinates OECD* work on the policy implications of ageing, says that plenty of research suggests older people are paid more because they are worth more.

And the virtues of the young may be exaggerated. 'The few companies that have kept on older workers find they have good judgement and their productivity is good,' says Peter Peterson, author of a recent book on the impact of ageing. 'Besides, their education standards are much better than those of today's young high-school graduates.' Companies may say that older workers are not worth training because they are reaching the end of their working lives; in fact, young people tend to switch jobs so frequently that they offer the worst returns on training. The median age for employer-driven training is the late 40s and early 50s, and this training goes mainly to managers.

*OECD: Organisation for Economic Co-operation and Development`;

const R_ROCKET = `The invention of rockets is linked inextricably with the invention of 'black powder'. Most historians of technology credit the Chinese with its discovery. They base their belief on studies of Chinese writings or on the notebooks of early Europeans who settled in or made long visits to China to study its history and civilisation. It is probable that, some time in the tenth century, black powder was first compounded from its basic ingredients of saltpetre, charcoal and sulphur. But this does not mean that it was immediately used to propel rockets. By the thirteenth century, powder-propelled fire arrows had become rather common. The Chinese relied on this type of technological development to produce incendiary projectiles of many sorts, explosive grenades and possibly cannons to repel their enemies. One such weapon was the 'basket of fire' or, as directly translated from Chinese, the 'arrows like flying leopards'. The 0.7 metre-long arrows, each with a long tube of gunpowder attached near the point of each arrow, could be fired from a long, octagonal-shaped basket at the same time and had a range of 400 paces. Another weapon was the 'arrow as a flying sabre', which could be fired from crossbows. The rocket, placed in a similar position to other rocket-propelled arrows, was designed to increase the range. A small iron weight was attached to the 1.5m bamboo shaft, just below the feathers, to increase the arrow's stability by moving the centre of gravity to a position below the rocket. At a similar time, the Arabs had developed the 'egg which moves and burns'. This 'egg' was apparently full of gunpowder and stabilised by a 1.5m tail. It was fired using two rockets attached to either side of this tail.

It was not until the eighteenth century that Europe became seriously interested in the possibilities of using the rocket itself as a weapon of war and not just to propel other weapons. Prior to this, rockets were used only in pyrotechnic displays. The incentive for the more aggressive use of rockets came not from within the European continent but from far-away India, whose leaders had built up a corps of rocketeers and used rockets successfully against the British in the late eighteenth century. The Indian rockets used against the British were described by a British Captain serving in India as 'an iron envelope about 200 millimetres long and 40 millimetres in diameter with sharp points at the top and a 3m-long bamboo guiding stick'. In the early nineteenth century the British began to experiment with incendiary barrage rockets. The British rocket differed from the Indian version in that it was completely encased in a stout, iron cylinder, terminating in a conical head, measuring one metre in diameter and having a stick almost five metres long and constructed in such a way that it could be firmly attached to the body of the rocket. The Americans developed a rocket, complete with its own launcher, to use against the Mexicans in the mid-nineteenth century. A long cylindrical tube was propped up by two sticks and fastened to the top of the launcher, thereby allowing the rockets to be inserted and lit from the other end. However, the results were sometimes not that impressive as the behaviour of the rockets in flight was less than predictable.`;

const R_DUNG = `Introducing dung* beetles into a pasture is a simple process: approximately 1,500 beetles are released, a handful at a time, into fresh cow pats** in the cow pasture. The beetles immediately disappear beneath the pats digging and tunnelling and, if they successfully adapt to their new environment, soon become a permanent, self-sustaining part of the local ecology. In time they multiply and within three or four years the benefits to the pasture are obvious.

Dung beetles work from the inside of the pat so they are sheltered from predators such as birds and foxes. Most species burrow into the soil and bury dung in tunnels directly underneath the pats, which are hollowed out from within. Some large species originating from France excavate tunnels to a depth of approximately 30 cm below the dung pat. These beetles make sausage-shaped brood chambers along the tunnels. The shallowest tunnels belong to a much smaller Spanish species that buries dung in chambers that hang like fruit from the branches of a pear tree. South African beetles dig narrow tunnels of approximately 20 cm below the surface of the pat. Some surface-dwelling beetles, including a South African species, cut perfectly-shaped balls from the pat, which are rolled away and attached to the bases of plants.

For maximum dung burial in spring, summer and autumn, farmers require a variety of species with overlapping periods of activity. In the cooler environments of the state of Victoria, the large French species (2.5 cms long), is matched with smaller (half this size), temperate-climate Spanish species. The former are slow to recover from the winter cold and produce only one or two generations of offspring from late spring until autumn. The latter, which multiply rapidly in early spring, produce two to five generations annually. The South African ball-rolling species, being a sub-tropical beetle, prefers the climate of northern and coastal New South Wales where it commonly works with the South African tunneling species. In warmer climates, many species are active for longer periods of the year.

* dung: the droppings or excreta of animals
** cow pats: droppings of cows`;

const R_PLAIN = `The instructions accompanying do-it-yourself products are regularly cited as a source of unnecessary expense or frustration. Few companies seem to test their instructions by having them followed by a first-time user. Often, essential information is omitted, steps in the construction process are taken for granted, and some degree of special knowledge is assumed. This is especially worrying in any fields where failure to follow correct procedures can be dangerous.

Objections to material in plain English have come mainly from the legal profession. Lawyers point to the risk of ambiguity inherent in the use of everyday language for legal or official documents, and draw attention to the need for confidence in legal formulations, which can come only from using language that has been tested in courts over the course of centuries. The campaigners point out that there has been no sudden increase in litigation as a consequence of the increase in plain English materials.

Similarly, professionals in several different fields have defended their use of technical and complex language as being the most precise means of expressing technical or complex ideas. This is undoubtedly true: scientists, doctors, bankers and others need their jargon in order to communicate with each other succinctly and unambiguously. But when it comes to addressing the non-specialist consumer, the campaigners argue, different criteria must apply.`;

const R_INVENT = `This Marvellous Invention

Of all mankind's manifold creations, language must take pride of place. Other inventions – the wheel, agriculture, sliced bread – may have transformed our material existence, but the advent of language is what made us human. Compared to language, all other inventions pale in significance, since everything we have ever achieved depends on language and originates from it. Without language, we could never have embarked on our ascent to unparalleled power over all other animals, and even over nature itself.

But language is foremost not just because it came first. In its own right it is a tool of extraordinary sophistication, yet based on an idea of ingenious simplicity: 'this marvellous invention of composing out of twenty-five or thirty sounds that infinite variety of expressions which, whilst having in themselves no likeness to what is in our mind, allow us to disclose to others its whole secret, and to make known to those who cannot penetrate it all that we imagine, and all the various stirrings of our soul'. This was how, in 1660, the renowned French grammarians of the Port-Royal abbey near Versailles distilled the essence of language, and no one since has celebrated more eloquently the magnitude of its achievement. Even so, there is just one flaw in all these hymns of praise, for the homage to language's unique accomplishment conceals a simple yet critical incongruity. Language is mankind's greatest invention – except, of course, that it was never invented. This apparent paradox is at the core of our fascination with language, and it holds many of its secrets.`;

const R_BIRDS = `The origins of birds

The science of evolutionary relationships has undergone a major change in recent decades. It used to be the case that all the features of organisms were important in working out their family tree. But following the work of German entomologist Willi Hennig, many evolutionary scientists now believe that the only features which carry any useful information are the evolutionary 'novelties' shared between organisms. Mice, lizards and fish, for example, all have backbones – so the feature 'backbone' tells us nothing about their evolutionary relationship. But the feature 'four legs' is useful because it's an evolutionary novelty – a characteristic shared only between the lizard and the mouse. This would suggest that the lizard and mouse are more closely related to each other than either is to the fish. This revolutionary approach is called cladistics, and it has been central to the idea that birds evolved from dinosaurs.

The 'birds are dinosaurs' theory was first developed by English palaeontologist Thomas Huxley (1825–1895). According to some accounts, one evening Huxley went to dinner still thinking about a mystery dinosaur bone in his lab. He knew he was dealing with the lower leg bone (tibia) of a meat-eating, two-legged dinosaur belonging to the classification known as theropods, but attached to the tibia was an unidentified extra bone. On the menu that evening was quail, a small bird similar to a pheasant, and Huxley noticed the same strange bone, attached to the quail tibia on his plate. He later realised that it was in fact the bird's anklebone. More importantly, Huxley concluded that its forms in both dinosaur and bird skeletons were so similar that they must be closely related.

Huxley's idea fell out of favour for fifty years following the 1916 publication of The Origin of Birds by the Danish doctor Gerhard Heilmann. During this time, Heilmann's theory was widely accepted. Heilmann had noted that two-legged, meat-eating dinosaurs lacked collarbones. In later evolutionary stages these bones fuse together to form the distinctive 'Y'-shaped bone in a bird's neck, known as the furcula. Heilmann proposed the notion that such a feature could not be lost and then re-evolve at a later date, so dinosaurs could not be the ancestors of birds.

Then, in the late 1960s, John Ostrom from Yale University in the USA, noted 22 features in the skeletons of meat-eating dinosaurs that were also found in birds and nowhere else. This reset the thinking on bird ancestry and once again Huxley's ideas caught the attention of the scientific community. Subsequent work has found up to 85 characteristics that tie dinosaurs and birds together. But what of Heilmann's missing bones? It turns out that not only did many dinosaurs have collarbones, these were also fused together into a furcula. Unfortunately for Heilmann, the fossil evidence was somewhat lacking in his day, and the few furculae that had been found were misidentified, usually as belly ribs.

US ornithologist Alan Feduccia and palaeontologist Larry Martin are two vocal opponents of the dinosaur theory. They contend that birds evolved from some unknown reptile at a time long before dinosaurs. Their reasoning is that flight is most likely to have started from a tree-climbing ancestor, yet all the proposed dinosaurian ancestors were ground-dwellers. But the dino-bird supporters contend that an unknown dinosaurian bird-ancestor could have been tree-dwelling, or that birds evolved flight from the ground up by chasing and leaping after insects. Most of Feduccia and Martin's case against the 'birds-are-dinosaurs' hypothesis is based on differences between birds and dinosaurs. Supporters of cladistics, however, maintain that differences between organisms do not matter, as it is the similarities between them that count. Evolution dictates that organisms will change through time, so it is only the features which persist that carry useful information about their origins.

Most people on either side of the debate do accept, however, that the ancient winged creature known as Archaeopteryx is an ancestor of today's birds. This is in spite of the fact that its form is distinctly non-bird-like, with a long bony tail, and teeth instead of a beak. The 'birds-are-dinosaurs' supporters contend that, if clearly-preserved feathers had not been found alongside two of the seven Archaeopteryx specimens, it would probably have been identified as a small dinosaur. However, Archaeopteryx does have some bird-like features, such as a furcula and bird-like feet, that suggest that it is too bird-like to be considered a dinosaur.

Over the last few decades several dinosaurs with bird-like features and primitive birds with dinosaur-like features have been found in several countries, connecting Archaeopteryx back to dinosaurs, and forwards to modern birds. Sinosauropteryx, excavated from 130-million-year-old rocks in northeast China, is one example. It has a dinosaur skeleton surrounded by a halo of fuzz, thought to be primitive feathers. And a reassessment of other dinosaurs reveals such bird-like features as hollow bones and a foot with three functional toes, characteristics that appeared over 50 million years before Archaeopteryx took to the air. And Rahonavis, a primitive bird from Madagascar is more bird-like than Archaeopteryx, yet retains some distinctive dinosaur features, including a long and vicious claw at the end of its wing. Over a century since Huxley's discovery, it seems that cladistics may have finally settled the 'dino-bird' debate.`;

const R_JEWEL = `Science in 16th-century London

The Jewel House, a new book by historical researcher and author Deborah Harkness.

Deborah Harkness devotes her elegant and erudite new book, The Jewel House, to the scientific community in 16th-century London. She (rightly) argues that it is thanks to the imaginative collective efforts of the urban scientists that London became the melting pot in which a new mathematical and experimental culture crystallized.

Harkness is known for her ingenuity as a researcher and her historical empathy. In The Jewel House, Harkness turns her skills on the city of London as a whole with surprising and fascinating results. She began her research by asking herself a new question: not what caused scientific revolution but what the names science and scientist meant in 16th-century London. Then she collected a vast range of sources, from printed books to scientific instruments and notebooks, and recorded, in a relational database, information on the men and women who produced them.

Every chapter of The Jewel House charts the activities of a particular community. Harkness leads us through the streets of London, showing us, neighborhood by neighborhood, where the major forms of natural knowledge found homes. For example, apothecaries settled in Lime Street, in what is now the City, where they created a dense network of shops and gardens. Clockmakers, both native craftsmen and many from overseas, clustered in several parishes near St Paul's Cathedral. The once wealthy merchant, Clement Draper, even managed to transform the King's Bench prison in Southwark, where he served time as a debtor, into a center of research and discussion. By the end of the book Harkness has mapped London's scientific communities with astonishing precision.

Moreover, when Harkness reconstructs these groups, she provides not traditional, static accounts of their theories, but dynamic analyses of their practices as these developed over time. In many cases, she makes clear, the alchemists of Elizabethan London already understood that knowledge of nature had to rest not on authority but on familiarity through practice.

In one crucial respect, Harkness argues, many of the 16th-century London scientists differed from the later ones of the 17th century. They saw themselves less as individuals out to gain fame, than as members of larger textual communities bent on exchanging and compiling information. The passages in which Harkness analyzes the 16th-century practices of note-taking and communication are among the most novel and informative in this fine book. She shows that they adopted the textual information processing methods of humanist scholarship to radically new ends.

In this book, Harkness has charted the local and cosmopolitan worlds of science in Elizabethan London with a learning, precision and intelligence that compel admiration. Moreover, she has crafted a complex and effective new analytical mechanism which may transform the practices of historians of early modern science.`;

export const IELTS_ACADEMIC_SET: ExamSet = {
  id: 'exam-ielts-academic-sample',
  title: 'IELTS Academic: Official Sample Tasks (Listening, Reading, Writing, Speaking)',
  vietnameseTitle: 'Đề Thi 22: IELTS Academic - Đề Mẫu Chính Thức 4 Kỹ Năng',
  category: 'ielts',
  categoryLabel: '🇬🇧 IELTS Academic',
  level: 'B2 - C1',
  durationMinutes: 165,
  passingScore: 60,
  expReward: 1500,
  coinReward: 1800,
  badgeIcon: '🇬🇧',
  summary:
    'Tuyển tập đề mẫu CHÍNH THỨC của IELTS (ielts.org): Nghe 30 câu / 7 dạng task kèm transcript; Đọc 43 câu / 10 dạng task trên 10 bài đọc thật (Marie Curie, dung beetles, rockets…) đáp án chuẩn; Viết 2 task (biểu đồ + essay) kèm bài mẫu của thí sinh và nhận xét giám khảo; Nói 3 phần kèm transcript mẫu. Bản số hóa hỗ trợ câu điền từ (fill) chấm tự động.',
  questions: [
    // ===== LISTENING - NOTE COMPLETION (Second-hand furniture) =====
    {
      id: 'ielts-l-nc1',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Nghe và hoàn thành ghi chú (Notes). Điền từ còn thiếu: “Dining table – ______ shape”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['round'],
      options: [],
      correctIndex: -1,
      explanation:
        'Người bán miêu tả: “it’s round… medium sized” → hình dáng là round. Ghi chú có sẵn từ “shape” nên chỗ trống cần một TÍNH TỪ miêu tả hình dáng.',
      pedagogicalTip:
        'Note Completion: đọc ghi chú trước khi nghe để đoán loại từ cần điền (tính từ/danh từ/số đo) — nghe sẽ dễ bắt hơn nhiều.',
    },
    {
      id: 'ielts-l-nc2',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Điền từ/số còn thiếu: “Dining table – ______ old”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['12 years', 'twelve years', '12years', '12 yrs'],
      options: [],
      correctIndex: -1,
      explanation:
        'Người bán tự sửa lời: “ten years? No it must be twelve by now.” → đáp án 12 years. “Ten years” chỉ là bẫy xuất hiện ngay trước.',
      pedagogicalTip:
        'IELTS Listening rất hay có “self-correction” — người nói nêu số A rồi tự sửa sang số B; luôn ghi nhận giá trị CUỐI CÙNG.',
    },
    {
      id: 'ielts-l-nc3',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Điền từ/số còn thiếu: “Dining chairs – set of ______ chairs”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['4', 'four'],
      options: [],
      correctIndex: -1,
      explanation: '“It’s a set of four chairs – there were two more but over the years a couple have disappeared.” → 4.',
      pedagogicalTip: 'Ghi chú “set of ______ chairs”: cần một CON SỐ. Chú ý bẫy “two more” (hai chiếc đã mất) xen giữa câu.',
    },
    {
      id: 'ielts-l-nc4',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “Dining chairs – seats covered in ______ material”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['green'],
      options: [],
      correctIndex: -1,
      explanation: '“they’re covered in material… That’s green” → màu/loại vật liệu là green.',
      pedagogicalTip: 'Từ tín hiệu “That’s ___” ngay sau mô tả thường là đáp án — tập trung nghe các câu “chốt” này.',
    },
    {
      id: 'ielts-l-nc5',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “Dining chairs – in ______ condition”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['reasonable'],
      options: [],
      correctIndex: -1,
      explanation: '“I’d say reasonable – they’ve had a bit of wear.” → reasonable (chấp nhận được, đã hơi cũ).',
      pedagogicalTip: 'Paraphrase: “they’ve had a bit of wear” = đã cũ nhưng vẫn ổn → reasonable; đừng nhầm với “good condition” của bàn làm việc.',
    },
    {
      id: 'ielts-l-nc6',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Điền số đo còn thiếu: “Desk – length: ______”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['1.20 metres', '1.20 meters', '1.2 metres', '1.2 meters', '1 metre 20', '1 meter 20', '1m 20'],
      options: [],
      correctIndex: -1,
      explanation:
        '“the length’s er r 1 metre 20” → length (chiều dài) = 1.20 metres. Bẫy: “75 cm high” phía trước là CHIỀU CAO, không phải chiều dài.',
      pedagogicalTip: 'Phân biệt length/width/height/depth khi nghe số đo — đề thường đưa các số đo khác để gây nhiễu.',
    },
    {
      id: 'ielts-l-nc7',
      section: 'listening',
      sectionName: 'Listening - Note Completion (Second-hand furniture)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “Desk – 3 drawers. Top drawer has a ______”.',
      audioScript: T_NOTE,
      acceptedAnswers: ['lock'],
      options: [],
      correctIndex: -1,
      explanation: '“It’s got 3 drawers – the top one’s got a lock so you can keep your valuables there.” → lock (khóa).',
      pedagogicalTip: 'Từ vựng nội thất hay gặp: drawer (ngăn kéo), lock (khóa), upholstered (bọc đệm), shaft (cán).',
    },

    // ===== LISTENING - TABLE COMPLETION (Learner persistence) =====
    {
      id: 'ielts-l-tc1',
      section: 'listening',
      sectionName: 'Listening - Table Completion (Learner persistence)',
      taskType: 'fill',
      question:
        'Nghe bài nói về “learner persistence” và hoàn thành bảng. Personal characteristics – mức quan trọng 1: “Enjoyment of a ______”.',
      audioScript: T_TABLE,
      acceptedAnswers: ['challenge', 'a challenge'],
      options: [],
      correctIndex: -1,
      explanation: '“many respondents reported that they took pleasure in challenge” → challenge. “took pleasure in” = enjoyment of.',
      pedagogicalTip: 'Nghe paraphrase: pleasure ↔ enjoyment; dạng Table Completion yêu cầu chép đúng dạng từ của từ khóa trong bài.',
    },
    {
      id: 'ielts-l-tc2',
      section: 'listening',
      sectionName: 'Listening - Table Completion (Learner persistence)',
      taskType: 'fill',
      question: 'Social and environmental factors – mức quan trọng 2: “Positive experiences at ______”.',
      audioScript: T_TABLE,
      acceptedAnswers: ['school'],
      options: [],
      correctIndex: -1,
      explanation: '“they had enjoyed themselves in school as an important social factor” → school. “enjoyed themselves in” = positive experiences at.',
      pedagogicalTip: 'Chú ý giới từ đi kèm: “at school” — bảng đã cho sẵn “at”, chỉ cần điền danh từ.',
    },
    {
      id: 'ielts-l-tc3',
      section: 'listening',
      sectionName: 'Listening - Table Completion (Learner persistence)',
      taskType: 'fill',
      question: 'Other factors – mức quan trọng 2: “Good ______”.',
      audioScript: T_TABLE,
      acceptedAnswers: ['health', 'decent health', 'good health'],
      options: [],
      correctIndex: -1,
      explanation: '“what was of most importance was decent health – this had a fairly strong influence” → health (decent health ≈ good health).',
      pedagogicalTip: 'Từ đồng nghĩa: decent health ≈ good health; đáp án chuẩn trong key chính thức là “health”.',
    },
    {
      id: 'ielts-l-tc4',
      section: 'listening',
      sectionName: 'Listening - Table Completion (Learner persistence)',
      taskType: 'fill',
      question: 'Personal characteristics – mức quan trọng 2: “Many ______ in daily life”.',
      audioScript: T_TABLE,
      acceptedAnswers: ['interests'],
      options: [],
      correctIndex: -1,
      explanation: '“it was important to have lots of interests in their everyday lives” → interests. “lots of” = many; “everyday” = daily.',
      pedagogicalTip: 'Đếm từ: bảng ghi “Many ______” (số nhiều) — đáp án phải là danh từ số nhiều “interests”.',
    },
    {
      id: 'ielts-l-tc5',
      section: 'listening',
      sectionName: 'Listening - Table Completion (Learner persistence)',
      taskType: 'fill',
      question: 'Social and environmental factors – mức quan trọng 3: “Good interaction with the ______”.',
      audioScript: T_TABLE,
      acceptedAnswers: ['tutor', 'tutors'],
      options: [],
      correctIndex: -1,
      explanation: '“several respondents talked about good relationships with their tutors” → tutors. “good relationships with” = good interaction with.',
      pedagogicalTip: 'Key chính thức ghi “tutor(s)” — cả số ít và số nhiều đều được chấp nhận.',
    },

    // ===== LISTENING - SENTENCE COMPLETION (Open University) =====
    {
      id: 'ielts-l-sc1',
      section: 'listening',
      sectionName: 'Listening - Sentence Completion (Studying with the Open University)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “Studying with the Open University demanded a great deal of ______.”',
      audioScript: T_SENT,
      acceptedAnswers: ['motivation'],
      options: [],
      correctIndex: -1,
      explanation: '“I found I needed to maintain a high level of motivation because it’s so different from school.” → motivation (a great deal of = high level of).',
      pedagogicalTip: 'Cụm định lượng (“a great deal of”) và danh từ không đếm được hay đi cùng nhau — nghe cụm là bắt được đáp án.',
    },
    {
      id: 'ielts-l-sc2',
      section: 'listening',
      sectionName: 'Listening - Sentence Completion (Studying with the Open University)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “Studying and working at the same time improved Rachel’s ______ skills.”',
      audioScript: T_SENT,
      acceptedAnswers: ['time management', 'time-management', 'timemanagement', 'time management skills'],
      options: [],
      correctIndex: -1,
      explanation: '“I got very good at time-management because I had to fit time for studying round a full-time job.” → time management.',
      pedagogicalTip: 'Cụm ghép có gạch nối (time-management) — viết “time management” không gạch nối cũng được chấp nhận.',
    },
    {
      id: 'ielts-l-sc3',
      section: 'listening',
      sectionName: 'Listening - Sentence Completion (Studying with the Open University)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “It is helpful that the course was structured in ______.”',
      audioScript: T_SENT,
      acceptedAnswers: ['modules', 'module'],
      options: [],
      correctIndex: -1,
      explanation: '“What makes it easier is that the degree is made up of modules.” → modules. structured in = made up of.',
      pedagogicalTip: 'Paraphrase chủ động/bị động: “the degree is made up of” ↔ “the course was structured in”.',
    },
    {
      id: 'ielts-l-sc4',
      section: 'listening',
      sectionName: 'Listening - Sentence Completion (Studying with the Open University)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “She enjoyed meeting other students at ______.”',
      audioScript: T_SENT,
      acceptedAnswers: ['summer school', 'summer schools'],
      options: [],
      correctIndex: -1,
      explanation: '“from time to time there are summer schools… They’re great because you meet all the other people” → summer schools.',
      pedagogicalTip: 'Nghe kỹ số ít/số nhiều: audio nói “summer schools” — key chấp nhận cả hai biến thể.',
    },

    // ===== LISTENING - MULTIPLE CHOICE, ONE ANSWER (Judy's dissertation) =====
    {
      id: 'ielts-l-mc1',
      section: 'listening',
      sectionName: 'Listening - Multiple Choice (Judy’s dissertation)',
      taskType: 'mcq',
      question: 'Nghe và chọn đáp án đúng: Why did Judy choose to study the East End of London?',
      audioScript: T_MC1,
      options: [
        'She wanted to understand her own background.',
        'She was interested in place names.',
        'She had read several books about it.',
      ],
      correctIndex: 0,
      explanation:
        '“in fact I was brought up there, and I’ve always been interested in finding out how the area shaped my upbringing” → cô lớn lên ở đó và muốn hiểu hoàn cảnh của chính mình (A). B chỉ là nội dung một cuốn sách; C là bẫy “lots of books have been published”.',
      pedagogicalTip: 'MCQ Listening: đáp án nhiễu thường lặp lại TỪ trong audio nhưng sai Ý — đặc biệt chú ý mệnh đề sau “But in fact…”.',
    },
    {
      id: 'ielts-l-mc2',
      section: 'listening',
      sectionName: 'Listening - Multiple Choice (Judy’s dissertation)',
      taskType: 'mcq',
      question: 'Nghe và chọn đáp án đúng: What was Judy’s main source of materials?',
      audioScript: T_MC1,
      options: ['books', 'newspapers', 'interviews'],
      correctIndex: 2,
      explanation:
        '“the bulk of my work is based on the elderly people from the area who I managed to contact and arrange to meet, and then recorded as they talked to me” → phỏng vấn (interviews). “The bulk of” = nguồn chính.',
      pedagogicalTip: 'Paraphrase: “recorded as they talked to me” = interviews; sách/báo chỉ là nguồn phụ đối chiếu.',
    },
    {
      id: 'ielts-l-mc3',
      section: 'listening',
      sectionName: 'Listening - Multiple Choice (Judy’s dissertation)',
      taskType: 'mcq',
      question: 'Nghe và chọn đáp án đúng: What difficulty did Judy have with her dissertation?',
      audioScript: T_MC1,
      options: ['writing the first draft', 'organising what she had collected', 'finding enough relevant sources'],
      correctIndex: 1,
      explanation:
        'Khi được hỏi “Was it difficult to get enough source material?”, cô đáp “Not a bit.” — tìm tài liệu KHÔNG khó. Khó khăn thật sự: “The problems started when I … sat down to devise a workable filing system” → sắp xếp tư liệu đã thu thập.',
      pedagogicalTip: 'Bẫy phủ định: “Not a bit” (không chút nào) giúp loại đáp án về việc tìm nguồn tài liệu.',
    },

    // ===== LISTENING - MULTIPLE CHOICE, MORE THAN ONE (Guide to the Library - split) =====
    {
      id: 'ielts-l-ml1',
      section: 'listening',
      sectionName: 'Listening - Multiple Choice (Guide to the Library)',
      taskType: 'mcq',
      question:
        'Nguyên bản yêu cầu chọn BA mục mà “Guide to the Library” có thông tin. (Bản số hóa tách thành 3 câu chọn một.) Câu 1: mục nào sau đây CÓ trong Guide?',
      audioScript: T_MCLIB,
      options: ['book reservations', 'reading room rules', 'catalogue', 'disabled facilities'],
      correctIndex: 0,
      explanation:
        '“there’s a section about how to reserve books that tells you what you need to do” → book reservations (A). Key gốc: đáp án đúng của cả câu là book reservations, location of rooms, café (thứ tự bất kỳ).',
      pedagogicalTip: 'Nghe từ đồng nghĩa: “a section about how to reserve books” = book reservations.',
    },
    {
      id: 'ielts-l-ml2',
      section: 'listening',
      sectionName: 'Listening - Multiple Choice (Guide to the Library)',
      taskType: 'mcq',
      question: 'Câu 2/3 (chọn một): mục nào sau đây CÓ trong Guide?',
      audioScript: T_MCLIB,
      options: ['staff', 'reading room rules', 'location of rooms', 'disabled facilities'],
      correctIndex: 2,
      explanation:
        '“inside you’ll find a plan of the library, showing where, for example, the reading room is” → location of rooms (E). “plan showing where…” là bằng chứng.',
      pedagogicalTip: 'Đừng chọn đáp án chỉ vì có TỪ giống: “reading room” xuất hiện trong audio nhưng Guide chỉ có SƠ ĐỒ VỊ TRÍ phòng, không phải nội quy.',
    },
    {
      id: 'ielts-l-ml3',
      section: 'listening',
      sectionName: 'Listening - Multiple Choice (Guide to the Library)',
      taskType: 'mcq',
      question: 'Câu 3/3 (chọn một): mục nào sau đây CÓ trong Guide?',
      audioScript: T_MCLIB,
      options: ['catalogue', 'regular events', 'disabled facilities', 'café'],
      correctIndex: 3,
      explanation:
        '“It also tells you about our café in the basement” → café (F). Bẫy: “special events” bị loại rõ ràng (“It doesn’t include things like the special events”).',
      pedagogicalTip: 'Ghi nhớ câu loại trừ trực tiếp: “doesn’t include…” giúp loại nhanh các đáp án nhiễu.',
    },

    // ===== LISTENING - FLOW-CHART COMPLETION (Life on other planets) =====
    {
      id: 'ielts-l-fc1',
      section: 'listening',
      sectionName: 'Listening - Flow-chart Completion (Detecting life on another planet)',
      taskType: 'fill',
      question:
        'Nghe và hoàn thành sơ đồ (Word bank: fossils, contamination, vehicle, powder, heat, results, radiation, site, microbes). Điền: “The rover is directed to a ______ which has organic material.”',
      audioScript: T_FLOW,
      acceptedAnswers: ['site'],
      options: [],
      correctIndex: -1,
      explanation: '“The rover needs to find a good range of organic material so they direct it to a site that’s likely to provide this.” → site.',
      pedagogicalTip: 'Flow-chart Completion: các bước nối tiếp nhau theo thứ tự audio — bám theo mũi tên để không bị lạc.',
    },
    {
      id: 'ielts-l-fc2',
      section: 'listening',
      sectionName: 'Listening - Flow-chart Completion (Detecting life on another planet)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “It collects a sample from below the surface (in order to avoid the effects of ______).”',
      audioScript: T_FLOW,
      acceptedAnswers: ['radiation'],
      options: [],
      correctIndex: -1,
      explanation:
        '“the surface might be exposed to high levels of radiation and that could kill anything living on the surface” → radiation. Bẫy: “contamination” cũng được nhắc nhưng bị phủ định (“No, the rover is clean”).',
      pedagogicalTip: 'Cẩn thận từ nhiễu trong word bank: “contamination” xuất hiện nhưng KHÔNG phải lý do lấy mẫu dưới bề mặt.',
    },
    {
      id: 'ielts-l-fc3',
      section: 'listening',
      sectionName: 'Listening - Flow-chart Completion (Detecting life on another planet)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “The sample is subjected to ______.”',
      audioScript: T_FLOW,
      acceptedAnswers: ['heat'],
      options: [],
      correctIndex: -1,
      explanation: '“in the next stage of the analysis, the sample has to be exposed to heat” → heat. subjected to = exposed to.',
      pedagogicalTip: 'Paraphrase: exposed to = subjected to — cùng nghĩa “chịu tác động của”.',
    },
    {
      id: 'ielts-l-fc4',
      section: 'listening',
      sectionName: 'Listening - Flow-chart Completion (Detecting life on another planet)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “A mass spectrometer is used to search for potential proof of life, e.g. ______.”',
      audioScript: T_FLOW,
      acceptedAnswers: ['microbes'],
      options: [],
      correctIndex: -1,
      explanation: '“This level of analysis is necessary to search for microscopic signs of life, much smaller than fossils, such as microbes.” → microbes.',
      pedagogicalTip: 'Chú ý “e.g.” trong sơ đồ — chỗ trống cần một VÍ DỤ cụ thể (microbes), không phải từ khái quát (fossils).',
    },
    {
      id: 'ielts-l-fc5',
      section: 'listening',
      sectionName: 'Listening - Flow-chart Completion (Detecting life on another planet)',
      taskType: 'fill',
      question: 'Điền từ còn thiếu: “The ______ are compared with existing data from Earth.”',
      audioScript: T_FLOW,
      acceptedAnswers: ['results'],
      options: [],
      correctIndex: -1,
      explanation: '“once all this has been done and the results sent back to Earth… They can compare them with data…” → results.',
      pedagogicalTip: '“compare them with data” — “them” thay thế cho “the results”; nghe đại từ thay thế để nối ý.',
    },

    // ===== LISTENING - SHORT ANSWER QUESTIONS (Pacific Clothing) =====
    {
      id: 'ielts-l-sa1',
      section: 'listening',
      sectionName: 'Listening - Short Answer (Careers at Pacific Clothing)',
      taskType: 'fill',
      question:
        'Nguyên bản: “List THREE types of staff that Pacific Clothing want to recruit at present.” Ba chỗ trống chấp nhận BẤT KỲ loại nào trong ba (thứ tự bất kỳ) — nhập MỘT loại tại đây.',
      audioScript: T_SA,
      acceptedAnswers: ['scientist', 'scientists', 'engineer', 'engineers', 'accountant', 'accountants'],
      options: [],
      correctIndex: -1,
      explanation: 'Audio: “we’re on the lookout for scientists… we are looking for engineers to work in the production department… we’re currently recruiting accountants.” → scientists, engineers, accountants.',
      pedagogicalTip: 'Short Answer: đọc giới hạn đề bài (“THREE types of staff”) — câu trả lời phải đúng loại từ (danh từ chỉ nghề).',
    },
    {
      id: 'ielts-l-sa2',
      section: 'listening',
      sectionName: 'Listening - Short Answer (Careers at Pacific Clothing)',
      taskType: 'fill',
      question: 'Loại nhân viên thứ hai (thứ tự bất kỳ — nhập một loại khác trong ba loại).',
      audioScript: T_SA,
      acceptedAnswers: ['scientist', 'scientists', 'engineer', 'engineers', 'accountant', 'accountants'],
      options: [],
      correctIndex: -1,
      explanation: 'Ba nghề được nêu: scientists (phòng nhuộm màu vải – dyes), engineers (bộ phận sản xuất – production), accountants (tài chính). Cả ba chỗ trống chấp nhận bất kỳ nghề nào.',
      pedagogicalTip: 'Dạng “in any order”: cả 3 đáp án đều đúng ở mọi vị trí — bản số hóa cho phép nhập bất kỳ thứ tự.',
    },
    {
      id: 'ielts-l-sa3',
      section: 'listening',
      sectionName: 'Listening - Short Answer (Careers at Pacific Clothing)',
      taskType: 'fill',
      question: 'Loại nhân viên thứ ba (thứ tự bất kỳ — nhập một loại khác trong ba loại).',
      audioScript: T_SA,
      acceptedAnswers: ['scientist', 'scientists', 'engineer', 'engineers', 'accountant', 'accountants'],
      options: [],
      correctIndex: -1,
      explanation: 'Đáp án chuẩn (key chính thức): scientist(s), engineer(s), accountant(s) — IN ANY ORDER. Lưu ý audio còn nhắc “designers” nhưng nói rõ “We’re not looking for any new designers at present” (bẫy).',
      pedagogicalTip: 'Đề nghe hay gài bẫy “không tuyển”: designers bị phủ định ngay trong audio — chỉ ghi ba nghề khẳng định.',
    },

    // ===== READING - TRUE / FALSE / NOT GIVEN (Marie Curie) =====
    {
      id: 'ielts-r-tf1',
      section: 'reading',
      sectionName: 'Reading - TRUE/FALSE/NOT GIVEN (The life and work of Marie Curie)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “Marie Curie’s husband was a joint winner of both Marie’s Nobel Prizes.”',
      readingPassage: R_MARIE,
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctIndex: 1,
      explanation:
        'Bài viết: bà là “sole winner” giải Nobel Hóa học 1911 (một mình), còn chồng bà chỉ đồng nhận giải Vật lý 1903 → câu này SAI (FALSE).',
      pedagogicalTip: 'TRUE/FALSE/NOT GIVEN: chú ý các từ tuyệt đối như both/all/only — chúng thường biến câu thành FALSE.',
    },
    {
      id: 'ielts-r-tf2',
      section: 'reading',
      sectionName: 'Reading - TRUE/FALSE/NOT GIVEN (The life and work of Marie Curie)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “Marie became interested in science when she was a child.”',
      readingPassage: R_MARIE,
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctIndex: 2,
      explanation:
        'Bài chỉ nói từ nhỏ Marie nổi bật nhờ TRÍ NHỚ siêu phàm — không hề nói cô thích KHOA HỌC từ nhỏ → thông tin không có trong bài (NOT GIVEN).',
      pedagogicalTip: 'NOT GIVEN ≠ FALSE: FALSE là ngược với bài; NOT GIVEN là bài không đủ thông tin để khẳng định hay phủ định.',
    },
    {
      id: 'ielts-r-tf3',
      section: 'reading',
      sectionName: 'Reading - TRUE/FALSE/NOT GIVEN (The life and work of Marie Curie)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “Marie was able to attend the Sorbonne because of her sister’s financial contribution.”',
      readingPassage: R_MARIE,
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctIndex: 0,
      explanation:
        'Đoạn 2–3: Marie bỏ tiền cho chị Bronia học y, đổi lại chị sẽ giúp cô học; “In 1891 this promise was fulfilled” → chị giúp Marie vào Sorbonne (TRUE).',
      pedagogicalTip: 'Đọc nối thông tin giữa hai đoạn: “promise” ở đoạn 2 → “fulfilled” ở đoạn 3 chính là bằng chứng TRUE.',
    },

    // ===== READING - NOTE COMPLETION (Marie Curie's research) =====
    {
      id: 'ielts-r-nc1',
      section: 'reading',
      sectionName: 'Reading - Note Completion (Marie Curie’s research on radioactivity)',
      taskType: 'fill',
      question:
        'Hoàn thành ghi chú: “When uranium was discovered to be radioactive, Marie Curie found that the element called ______ had the same property.”',
      readingPassage: R_MARIE,
      acceptedAnswers: ['thorium'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 4: “Marie Curie decided to find out if the radioactivity discovered in uranium was to be found in other elements. She discovered that this was true for thorium.” → thorium.',
      pedagogicalTip: 'Bài đọc học thuật: tên nguyên tố (thorium/radium) phải chép đúng chính tả; không viết hoa vẫn được chấp nhận.',
    },
    {
      id: 'ielts-r-nc2',
      section: 'reading',
      sectionName: 'Reading - Note Completion (Marie Curie’s research on radioactivity)',
      taskType: 'fill',
      question:
        'Hoàn thành ghi chú: “Marie and Pierre Curie’s research into the radioactivity of the mineral known as ______ led to the discovery of two new elements.”',
      readingPassage: R_MARIE,
      acceptedAnswers: ['pitchblende'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 5: “she found her interest drawn to pitchblende, a mineral whose radioactivity… led to the discovery of the new elements, polonium and radium.” → pitchblende.',
      pedagogicalTip: 'Trong Summary/Note Completion, đáp án là từ LẤY NGUYÊN VĂN trong bài — vừa đọc vừa dò từ khóa “mineral”.',
    },
    {
      id: 'ielts-r-nc3',
      section: 'reading',
      sectionName: 'Reading - Note Completion (Marie Curie’s research on radioactivity)',
      taskType: 'fill',
      question: 'Hoàn thành ghi chú: “In 1911, Marie Curie received recognition for her work on the element ______.”',
      readingPassage: R_MARIE,
      acceptedAnswers: ['radium'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 7: “In 1911 she was awarded the Nobel Prize for Chemistry for the isolation of a pure form of radium.” → radium.',
      pedagogicalTip: 'Paraphrase ngày/sự kiện: “received recognition” = was awarded (Nobel Prize) — bám mốc năm 1911.',
    },
    {
      id: 'ielts-r-nc4',
      section: 'reading',
      sectionName: 'Reading - Note Completion (Marie Curie’s research on radioactivity)',
      taskType: 'fill',
      question: 'Hoàn thành ghi chú: “Marie and Irène Curie developed X-radiography which was used as a medical technique for ______.”',
      readingPassage: R_MARIE,
      acceptedAnswers: ['soldiers', 'wounded soldiers'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 8: “the mobile units which came to be known as ‘Little Curies’, used for the treatment of wounded soldiers.” → (wounded) soldiers.',
      pedagogicalTip: 'Đừng quên tính từ bổ nghĩa: “wounded soldiers” — điền “soldiers” hoặc cả cụm đều đúng.',
    },
    {
      id: 'ielts-r-nc5',
      section: 'reading',
      sectionName: 'Reading - Note Completion (Marie Curie’s research on radioactivity)',
      taskType: 'fill',
      question: 'Hoàn thành ghi chú: “Marie Curie saw the importance of collecting radioactive material both for research and for cases of ______.”',
      readingPassage: R_MARIE,
      acceptedAnswers: ['illness', 'illness.'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 10: “the need to accumulate intense radioactive sources, not only to treat illness but also to maintain an abundant supply for research.” → illness.',
      pedagogicalTip: 'Cấu trúc “not only… but also” — hai vế tương ứng hai mục đích: treat illness / supply for research.',
    },
    {
      id: 'ielts-r-nc6',
      section: 'reading',
      sectionName: 'Reading - Note Completion (Marie Curie’s research on radioactivity)',
      taskType: 'fill',
      question:
        'Hoàn thành ghi chú: “The radioactive material stocked in Paris contributed to the discoveries in the 1930s of the ______ and of what was known as artificial radioactivity.”',
      readingPassage: R_MARIE,
      acceptedAnswers: ['neutron'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 10: “This work prepared the way for the discovery of the neutron by Sir James Chadwick and… artificial radioactivity.” → neutron.',
      pedagogicalTip: 'Chép đúng danh từ chuyên ngành số ít: neutron (không phải “neutrons”).',
    },

    // ===== READING - TABLE COMPLETION (Dung beetles) =====
    {
      id: 'ielts-r-tc1',
      section: 'reading',
      sectionName: 'Reading - Table Completion (Dung beetles)',
      taskType: 'fill',
      question: 'Hoàn thành bảng về các loài bọ hung. Cột “Spanish”: Preferred climate = ______.',
      readingPassage: R_DUNG,
      acceptedAnswers: ['temperate', 'temperate-climate'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 3: “the large French species (2.5 cms long), is matched with smaller (half this size), temperate-climate Spanish species.” → temperate.',
      pedagogicalTip: 'Đọc bảng theo CỘT: hàng “Preferred climate” của Spanish nằm cùng dòng với “cool” của French.',
    },
    {
      id: 'ielts-r-tc2',
      section: 'reading',
      sectionName: 'Reading - Table Completion (Dung beetles)',
      taskType: 'fill',
      question: 'Cột “South African ball roller”: Preferred climate = ______.',
      readingPassage: R_DUNG,
      acceptedAnswers: ['sub-tropical', 'subtropical', 'sub tropical'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 3: “The South African ball-rolling species, being a sub-tropical beetle, prefers the climate of northern and coastal New South Wales.” → sub-tropical.',
      pedagogicalTip: 'Từ ghép có gạch nối (sub-tropical) — viết liền “subtropical” cũng được chấp nhận.',
    },
    {
      id: 'ielts-r-tc3',
      section: 'reading',
      sectionName: 'Reading - Table Completion (Dung beetles)',
      taskType: 'fill',
      question: 'Hàng “Complementary species”: loài bổ trợ làm việc cùng “South African ball roller” là ______.',
      readingPassage: R_DUNG,
      acceptedAnswers: ['south african tunneling', 'south african tunnelling', 'south african tunneling species', 'south african tunnelling species'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 3: “where it commonly works with the South African tunneling species.” → South African tunneling. (Loài French có complementary là Spanish.)',
      pedagogicalTip: 'Chép đúng cả cụm 3 từ theo bài: “success” nằm ở việc không rút gọn “tunneling species”.',
    },
    {
      id: 'ielts-r-tc4',
      section: 'reading',
      sectionName: 'Reading - Table Completion (Dung beetles)',
      taskType: 'fill',
      question: 'Cột “Spanish”: Start of active period = ______.',
      readingPassage: R_DUNG,
      acceptedAnswers: ['early spring'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 3: “The latter, which multiply rapidly in early spring, produce two to five generations annually.” — “the latter” = loài Spanish → early spring.',
      pedagogicalTip: 'Đại từ nối “The former… The latter…” rất hay xuất hiện: former = French, latter = Spanish.',
    },
    {
      id: 'ielts-r-tc5',
      section: 'reading',
      sectionName: 'Reading - Table Completion (Dung beetles)',
      taskType: 'fill',
      question: 'Cột “Spanish”: Number of generations per year = ______.',
      readingPassage: R_DUNG,
      acceptedAnswers: ['2 to 5', '2-5', 'two to five', '2 to five', 'two to 5'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 3: “produce two to five generations annually.” → 2 to 5 (key chính thức ghi “two/2 to/- five/5”).',
      pedagogicalTip: 'Viết số dạng khoảng: “2 to 5” hoặc “2-5” — cả hai đều đúng theo đáp án chính thức.',
    },

    // ===== READING - MULTIPLE CHOICE (Older workers - grey workers) =====
    {
      id: 'ielts-r-mc1',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Older workers)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “In paragraph one, the writer suggests that companies could consider…”',
      readingPassage: R_GREY1,
      options: [
        'abolishing pay schemes that are based on age.',
        'avoiding pay that is based on piece-rates.',
        'increasing pay for older workers.',
        'equipping older workers with new skills.',
      ],
      correctIndex: 0,
      explanation:
        'Đoạn 1: “Take away seniority-based pay scales, and older workers may become a much more attractive employment proposition.” → bỏ thang lương theo thâm niên (seniority-based = age-based).',
      pedagogicalTip: 'Paraphrase: seniority-based pay scales ↔ pay schemes based on age — đáp án MCQ thường diễn đạt lại nguyên văn.',
    },
    {
      id: 'ielts-r-mc2',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Older workers)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “Skill Team is an example of a company which…”',
      readingPassage: R_GREY1,
      options: [
        'offers older workers increases in salary.',
        'allows people to continue working for as long as they want.',
        'allows the expertise of older workers to be put to use.',
        'treats older and younger workers equally.',
      ],
      correctIndex: 2,
      explanation:
        'Đoạn 2: Skill Team giúp IBM “retain access to some of the intellectual capital it would otherwise have lost” → tận dụng chuyên môn người lớn tuổi (the expertise). B sai vì hợp đồng tối đa đến 60 tuổi (“up to the age of 60”).',
      pedagogicalTip: 'Cẩn thận với các từ tuyệt đối trong đáp án nhiễu (“as long as they want”) — nguyên văn có giới hạn tuổi 60.',
    },
    {
      id: 'ielts-r-mc3',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Older workers)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “According to the writer, ‘bridge’ jobs…”',
      readingPassage: R_GREY1,
      options: [
        'tend to attract people in middle-salary ranges.',
        'are better paid than some full-time jobs.',
        'originated in the United States.',
        'appeal to distinct groups of older workers.',
      ],
      correctIndex: 3,
      explanation:
        'Đoạn 3: “There seem to be two very different types of bridge job-holder – those who continue working because they have to and those who continue working because they want to.” → hấp dẫn hai nhóm rất khác nhau (distinct groups). A sai: “it is the best-paid and worst-paid who carry on working”.',
      pedagogicalTip: 'Đọc kỹ câu chứa số liệu: “best-paid and worst-paid” phá vỡ đáp án nhiễu “middle-salary ranges”.',
    },
    {
      id: 'ielts-r-mc4',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Older workers)',
      taskType: 'mcq',
      question: 'Đọc bài và chọn đáp án: “David Storey’s study found that…”',
      readingPassage: R_GREY1,
      options: [
        'people demand more from their work as they get older.',
        'older people are good at running their own businesses.',
        'an increasing number of old people are self-employed.',
        'few young people have their own businesses.',
      ],
      correctIndex: 1,
      explanation:
        'Đoạn 4: “a study by David Storey of Warwick University found that in Britain 70% of businesses started by people over 55 survived, compared with an overall national average of only 19%.” → người lớn tuổi kinh doanh hiệu quả (70% > 19%).',
      pedagogicalTip: 'Câu hỏi số liệu: đối chiếu 70% (người trên 55) với 19% (trung bình chung) để suy ra kết luận đúng.',
    },

    // ===== READING - MULTIPLE CHOICE, MORE THAN ONE (Older/younger workers - split) =====
    {
      id: 'ielts-r-mm1',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Advantages of older workers)',
      taskType: 'mcq',
      question:
        'Nguyên bản hỏi: “Which TWO advantages are mentioned…?” (Bản số hóa tách thành 2 câu chọn một.) Câu 1/2: lợi thế nào được tác giả NÊU RA?',
      readingPassage: R_GREY2,
      options: [
        'They are less likely to be involved in careless accidents.',
        'They can predict areas that may cause trouble in the future.',
        'They are able to train younger workers.',
        'They are more conscientious.',
      ],
      correctIndex: 1,
      explanation:
        'Đoạn 1: “an ability to… spot a problem before it blows up” → dự đoán vấn đề trước khi bùng phát (B = predict areas that may cause trouble). Key gốc: hai đáp án đúng là B và G (thứ tự bất kỳ).',
      pedagogicalTip: '“spot a problem before it blows up” = “predict areas that may cause trouble in the future” — học cụm idiom “before it blows up”.',
    },
    {
      id: 'ielts-r-mm2',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Advantages of older workers)',
      taskType: 'mcq',
      question: 'Câu 2/2 (chọn một): lợi thế nào được tác giả NÊU RA?',
      readingPassage: R_GREY2,
      options: [
        'They can deal with unexpected problems.',
        'They are more conscientious.',
        'They are prepared to work for lower salaries.',
        'They are more skilled in personal relationships.',
      ],
      correctIndex: 3,
      explanation:
        'Đoạn 1: “an ability to handle people diplomatically” → kỹ năng quan hệ con người (G = more skilled in personal relationships).',
      pedagogicalTip: '“handle people diplomatically” = khéo léo trong quan hệ — không nhầm với “deal with unexpected problems”.',
    },
    {
      id: 'ielts-r-mm3',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Disadvantages of younger workers)',
      taskType: 'mcq',
      question:
        'Nguyên bản hỏi: “Which TWO disadvantages are mentioned…?” (tách thành 2 câu chọn một.) Câu 1/2: hạn chế nào của lao động trẻ được tác giả NÊU RA?',
      readingPassage: R_GREY2,
      options: [
        'They are too confident of their own skills.',
        'They may injure themselves.',
        'They do not stay with the same company for very long.',
        'Their training has been too theoretical.',
      ],
      correctIndex: 2,
      explanation:
        'Đoạn 2: “young people tend to switch jobs so frequently that they offer the worst returns on training” → hay nhảy việc (C). Key gốc: hai đáp án đúng là C và E.',
      pedagogicalTip: '“switch jobs so frequently” = “do not stay with the same company for very long” — paraphrase then chốt.',
    },
    {
      id: 'ielts-r-mm4',
      section: 'reading',
      sectionName: 'Reading - Multiple Choice (Disadvantages of younger workers)',
      taskType: 'mcq',
      question: 'Câu 2/2 (chọn một): hạn chế nào của lao động trẻ được tác giả NÊU RA?',
      readingPassage: R_GREY2,
      options: [
        'They are too confident of their own skills.',
        'Their training has been too theoretical.',
        'They are not as well educated as older workers.',
        'They demand higher salaries.',
      ],
      correctIndex: 2,
      explanation:
        'Đoạn 2, lời Peter Peterson: “their education standards are much better than those of today’s young high-school graduates” → lao động trẻ học vấn thấp hơn (E).',
      pedagogicalTip: 'So sánh hơn “much better than” — chú ý VẾ SAU dấu “than” mới là đối tượng bị chê.',
    },

    // ===== READING - MATCHING FEATURES (Rockets - split to MCQ) =====
    {
      id: 'ielts-r-mf1',
      section: 'reading',
      sectionName: 'Reading - Matching Features (The invention of rockets)',
      taskType: 'mcq',
      question: 'Đọc bài “The invention of rockets”. “black powder” — First invented or used by?',
      readingPassage: R_ROCKET,
      options: ['the Chinese', 'the Indians', 'the British', 'the Arabs', 'the Americans'],
      correctIndex: 0,
      explanation: 'Đoạn 1: “Most historians of technology credit the Chinese with its discovery.” → black powder do người Trung Quốc (A).',
      pedagogicalTip: 'Matching Features dạng số hóa thành MCQ: đọc câu hỏi → dò từ khóa chủ thể trong bài theo thứ tự xuất hiện.',
    },
    {
      id: 'ielts-r-mf2',
      section: 'reading',
      sectionName: 'Reading - Matching Features (The invention of rockets)',
      taskType: 'mcq',
      question: '“rocket-propelled arrows for fighting” — First invented or used by?',
      readingPassage: R_ROCKET,
      options: ['the Chinese', 'the Indians', 'the British', 'the Arabs', 'the Americans'],
      correctIndex: 0,
      explanation:
        'Đoạn 1: “By the thirteenth century, powder-propelled fire arrows had become rather common. The Chinese relied on this type of technological development to produce incendiary projectiles…” → người Trung Quốc (A).',
      pedagogicalTip: 'Chú ý: “the Arabs” cũng có vũ khí đầu đoạn 1 (“the egg which moves and burns”) — nhưng mục được hỏi là fire arrows của người Trung Quốc.',
    },
    {
      id: 'ielts-r-mf3',
      section: 'reading',
      sectionName: 'Reading - Matching Features (The invention of rockets)',
      taskType: 'mcq',
      question: '“rockets as war weapons” — First invented or used by?',
      readingPassage: R_ROCKET,
      options: ['the Chinese', 'the Indians', 'the British', 'the Arabs', 'the Americans'],
      correctIndex: 1,
      explanation:
        'Đoạn 2: “The incentive for the more aggressive use of rockets came… from far-away India, whose leaders had built up a corps of rocketeers and used rockets successfully against the British in the late eighteenth century.” → người Ấn Độ (B).',
      pedagogicalTip: 'Phân biệt “rocket-propelled arrows” (TQ) và “rockets as war weapons” (Ấn Độ, dùng chống Anh) — hai mốc khác nhau.',
    },
    {
      id: 'ielts-r-mf4',
      section: 'reading',
      sectionName: 'Reading - Matching Features (The invention of rockets)',
      taskType: 'mcq',
      question: '“the rocket launcher” — First invented or used by?',
      readingPassage: R_ROCKET,
      options: ['the Chinese', 'the Indians', 'the British', 'the Arabs', 'the Americans'],
      correctIndex: 4,
      explanation: 'Đoạn 2: “The Americans developed a rocket, complete with its own launcher, to use against the Mexicans in the mid-nineteenth century.” → người Mỹ (E).',
      pedagogicalTip: '“complete with its own launcher” = kèm bệ phóng — từ khóa quyết định cho đáp án Americans.',
    },

    // ===== READING - SUMMARY COMPLETION (Plain English) =====
    {
      id: 'ielts-r-st1',
      section: 'reading',
      sectionName: 'Reading - Summary Completion (Plain English)',
      taskType: 'fill',
      question: 'Hoàn thành tóm tắt: “Consumers often complain that they experience a feeling of ______ when trying to put together do-it-yourself products…”',
      readingPassage: R_PLAIN,
      acceptedAnswers: ['frustration'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 1: “The instructions accompanying do-it-yourself products are regularly cited as a source of unnecessary expense or frustration.” → frustration.',
      pedagogicalTip: 'Summary Completion: chú ý trật tự câu trong summary thường TRÙNG trật tự thông tin trong bài — dò lần lượt từ trên xuống.',
    },
    {
      id: 'ielts-r-st2',
      section: 'reading',
      sectionName: 'Reading - Summary Completion (Plain English)',
      taskType: 'fill',
      question: 'Hoàn thành tóm tắt: “…which have not been tested by companies on a ______.”',
      readingPassage: R_PLAIN,
      acceptedAnswers: ['first-time user', 'first time user', 'first-time users'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 1: “Few companies seem to test their instructions by having them followed by a first-time user.” → first-time user.',
      pedagogicalTip: 'Giữ nguyên từ ghép nối gạch (first-time user) — đây là cụm chuẩn trong đáp án chính thức.',
    },
    {
      id: 'ielts-r-st3',
      section: 'reading',
      sectionName: 'Reading - Summary Completion (Plain English)',
      taskType: 'fill',
      question: 'Hoàn thành tóm tắt: “…it is especially important that ______ information is not left out…”',
      readingPassage: R_PLAIN,
      acceptedAnswers: ['essential'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 1: “Often, essential information is omitted.” → essential (omitted = left out).',
      pedagogicalTip: 'Paraphrase: omitted ↔ left out; câu summary đảo sang phủ định “is not left out” nhưng từ cần điền giữ nguyên.',
    },
    {
      id: 'ielts-r-st4',
      section: 'reading',
      sectionName: 'Reading - Summary Completion (Plain English)',
      taskType: 'fill',
      question: 'Hoàn thành tóm tắt: “…or the consumer having a certain amount of ______.”',
      readingPassage: R_PLAIN,
      acceptedAnswers: ['special knowledge'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 1: “some degree of special knowledge is assumed.” → special knowledge (no assumptions are made ↔ some degree is assumed).',
      pedagogicalTip: '“some degree of” ↔ “a certain amount of” — paraphrase số lượng hay gặp.',
    },
    {
      id: 'ielts-r-st5',
      section: 'reading',
      sectionName: 'Reading - Summary Completion (Plain English)',
      taskType: 'fill',
      question: 'Hoàn thành tóm tắt: “Lawyers… feel that it would result in ambiguity in documents and cause people to lose faith in ______…”',
      readingPassage: R_PLAIN,
      acceptedAnswers: ['legal formulations', 'legal formulation'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 2: “the need for confidence in legal formulations, which can come only from using language that has been tested in courts.” → legal formulations (confidence in ↔ lose faith in).',
      pedagogicalTip: 'Đổi cực từ: “confidence in” trong bài → “lose faith in” trong summary — chỗ trống vẫn là cụm danh từ đó.',
    },

    // ===== READING - SUMMARY COMPLETION, WORD LIST (This Marvellous Invention) =====
    {
      id: 'ielts-r-sl1',
      section: 'reading',
      sectionName: 'Reading - Summary Completion with Word List (This Marvellous Invention)',
      taskType: 'fill',
      question:
        'Chọn từ trong danh sách (difficult, complex, original, admired, material, easy, fundamental) điền vào chỗ trống: “The wheel is one invention that has had a major impact on ______ aspects of life…”',
      readingPassage: R_INVENT,
      acceptedAnswers: ['material'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 1: “Other inventions – the wheel, agriculture, sliced bread – may have transformed our material existence.” → material.',
      pedagogicalTip: 'Dạng word list: loại dần theo loại từ (tính từ) + nghĩa — “material existence” = “material aspects of life”.',
    },
    {
      id: 'ielts-r-sl2',
      section: 'reading',
      sectionName: 'Reading - Summary Completion with Word List (This Marvellous Invention)',
      taskType: 'fill',
      question: '“…but no impact has been as ______ as that of language.”',
      readingPassage: R_INVENT,
      acceptedAnswers: ['fundamental'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 1: “Compared to language, all other inventions pale in significance.” → fundamental (pale in significance = kém quan trọng hơn).',
      pedagogicalTip: 'So sánh “as… as”: “no impact has been as fundamental as that of language” = ngôn ngữ quan trọng nhất.',
    },
    {
      id: 'ielts-r-sl3',
      section: 'reading',
      sectionName: 'Reading - Summary Completion with Word List (This Marvellous Invention)',
      taskType: 'fill',
      question: '“Language is very ______, yet composed of just a small number of sounds.”',
      readingPassage: R_INVENT,
      acceptedAnswers: ['complex'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 2: “a tool of extraordinary sophistication, yet based on an idea of ingenious simplicity: …composing out of twenty-five or thirty sounds…” → complex (sophistication ↔ complex).',
      pedagogicalTip: 'Từ “yet” báo tương phản: phức tạp (sophistication) vs đơn giản (25-30 âm) — chọn tính từ phù hợp vế trước.',
    },
    {
      id: 'ielts-r-sl4',
      section: 'reading',
      sectionName: 'Reading - Summary Completion with Word List (This Marvellous Invention)',
      taskType: 'fill',
      question: '“Language appears to be ______ to use. However, its sophistication is often overlooked.”',
      readingPassage: R_INVENT,
      acceptedAnswers: ['easy'],
      options: [],
      correctIndex: -1,
      explanation: 'Đối lập “appears to be ______” với “However, its sophistication is often overlooked” → easy (bề ngoài dễ dùng nhưng thực ra rất tinh vi).',
      pedagogicalTip: '“appears to be… However…” = tín hiệu chọn từ trái nghĩa với “sophistication”.',
    },

    // ===== READING - SENTENCE COMPLETION (The origins of birds) =====
    {
      id: 'ielts-r-sn1',
      section: 'reading',
      sectionName: 'Reading - Sentence Completion (The origins of birds)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “Huxley formulated his theory while studying a dinosaur belonging to a group called ______.”',
      readingPassage: R_BIRDS,
      acceptedAnswers: ['theropods', 'theropod'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 2: “a meat-eating, two-legged dinosaur belonging to the classification known as theropods.” → theropods.',
      pedagogicalTip: 'Tên nhóm khủng long chuyên ngành: chép đúng “theropods” (có thể thêm/số ít số nhiều).',
    },
    {
      id: 'ielts-r-sn2',
      section: 'reading',
      sectionName: 'Reading - Sentence Completion (The origins of birds)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “Heilmann rejected Huxley’s theory because of the apparent absence of ______ in dinosaurs.”',
      readingPassage: R_BIRDS,
      acceptedAnswers: ['collarbones', 'collar bones'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 3: “Heilmann had noted that two-legged, meat-eating dinosaurs lacked collarbones.” → collarbones (lacked = apparent absence of).',
      pedagogicalTip: 'Paraphrase: lacked ↔ apparent absence of — cùng nói về sự thiếu vắng xương quạ (collarbones).',
    },
    {
      id: 'ielts-r-sn3',
      section: 'reading',
      sectionName: 'Reading - Sentence Completion (The origins of birds)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “Feduccia and Martin believe that the ancestor of today’s birds was a kind of early ______.”',
      readingPassage: R_BIRDS,
      acceptedAnswers: ['reptile'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 5: “They contend that birds evolved from some unknown reptile at a time long before dinosaurs.” → reptile.',
      pedagogicalTip: 'Cần danh từ SỐ ÍT sau “a kind of early ___”: reptile (không thêm -s).',
    },
    {
      id: 'ielts-r-sn4',
      section: 'reading',
      sectionName: 'Reading - Sentence Completion (The origins of birds)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “In cladistics, the ______ between organisms’ characteristics are of major importance.”',
      readingPassage: R_BIRDS,
      acceptedAnswers: ['similarities', 'similarity'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 5: “differences between organisms do not matter, as it is the similarities between them that count.” → similarities.',
      pedagogicalTip: 'Cladistics quan tâm “similarities” chứ không phải “differences” — đọc cả câu để chọn đúng vế.',
    },
    {
      id: 'ielts-r-sn5',
      section: 'reading',
      sectionName: 'Reading - Sentence Completion (The origins of birds)',
      taskType: 'fill',
      question: 'Hoàn thành câu: “The dangerous ______ on a primitive bird from Madagascar adds weight to the ‘dino-bird’ argument.”',
      readingPassage: R_BIRDS,
      acceptedAnswers: ['claw'],
      options: [],
      correctIndex: -1,
      explanation: 'Đoạn 7: “Rahonavis, a primitive bird from Madagascar… retains some distinctive dinosaur features, including a long and vicious claw at the end of its wing.” → claw.',
      pedagogicalTip: 'Paraphrase tính từ: vicious ↔ dangerous — từ cần điền vẫn là danh từ “claw”.',
    },

    // ===== READING - MATCHING SENTENCE ENDINGS (Science in 16th-century London) =====
    {
      id: 'ielts-r-me1',
      section: 'reading',
      sectionName: 'Reading - Matching Sentence Endings (Science in 16th-century London)',
      taskType: 'mcq',
      question: 'Chọn phần kết đúng: “Harkness’s research method was different to that of other writers because ______.”',
      readingPassage: R_JEWEL,
      options: [
        'she has the greatest knowledge of Elizabethan London.',
        'she started by seeking to understand how basic terms were used in the past.',
        'they worked as individuals rather than as a group.',
        'she examined how their methods evolved and changed.',
        'Clement Draper was the best scientist of his time.',
        'they used old ways of analysing written information for new purposes.',
      ],
      correctIndex: 1,
      explanation:
        'Đoạn 3: “She began her research by asking herself a new question: not what caused scientific revolution but what the names science and scientist meant in 16th-century London.” → bà bắt đầu bằng việc tìm hiểu ý nghĩa các thuật ngữ cơ bản thời trước (đáp án B).',
      pedagogicalTip: 'Matching Sentence Endings: ghép theo NGHĨA cả câu, không chỉ theo từ khóa lặp lại.',
    },
    {
      id: 'ielts-r-me2',
      section: 'reading',
      sectionName: 'Reading - Matching Sentence Endings (Science in 16th-century London)',
      taskType: 'mcq',
      question: 'Chọn phần kết đúng: “Harkness’s reconstruction of the 16th-century London scientific groups was new because ______.”',
      readingPassage: R_JEWEL,
      options: [
        'she has the greatest knowledge of Elizabethan London.',
        'she started by seeking to understand how basic terms were used in the past.',
        'they worked as individuals rather than as a group.',
        'she examined how their methods evolved and changed.',
        'Clement Draper was the best scientist of his time.',
        'they used old ways of analysing written information for new purposes.',
      ],
      correctIndex: 3,
      explanation:
        'Đoạn 4: “she provides not traditional, static accounts of their theories, but dynamic analyses of their practices as these developed over time.” → bà phân tích cách phương pháp của họ TIẾN HÓA theo thời gian (đáp án D).',
      pedagogicalTip: 'Cặp đối lập “static accounts” vs “dynamic analyses… developed over time” chính là “evolved and changed”.',
    },
    {
      id: 'ielts-r-me3',
      section: 'reading',
      sectionName: 'Reading - Matching Sentence Endings (Science in 16th-century London)',
      taskType: 'mcq',
      question: 'Chọn phần kết đúng: “Harkness shows that the 16th-century London scientists were innovative because ______.”',
      readingPassage: R_JEWEL,
      options: [
        'she has the greatest knowledge of Elizabethan London.',
        'she started by seeking to understand how basic terms were used in the past.',
        'they worked as individuals rather than as a group.',
        'she examined how their methods evolved and changed.',
        'Clement Draper was the best scientist of his time.',
        'they used old ways of analysing written information for new purposes.',
      ],
      correctIndex: 5,
      explanation:
        'Đoạn 5: “they adopted the textual information processing methods of humanist scholarship to radically new ends.” → họ dùng cách xử lý văn bản CŨ cho MỤC ĐÍCH MỚI (đáp án F).',
      pedagogicalTip: '“adopted old methods to radically new ends” = “used old ways… for new purposes” — ghép đúng cặp cụm song song.',
    },

    // ===== WRITING TASK 1 (Academic - chart) =====
    {
      id: 'ielts-w1',
      section: 'writing',
      sectionName: 'Writing - Task 1: Số chuyến đi của trẻ em (Chart)',
      taskType: 'writing',
      question: 'Writing Task 1 (Academic): mô tả biểu đồ số chuyến đi của trẻ em 1990 vs 2010 — tối thiểu 150 từ (~20 phút).',
      writingPrompt:
        'Writing Task 1 (≥150 từ, ~20 phút)\n\nThe chart below shows the number of trips made by children in one country in 1990 and 2010 to travel to and from school using different modes of transport.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\n[* Biểu đồ gốc là hình — số liệu chuyển thành bảng dưới đây, đơn vị: triệu chuyến/năm, trẻ 5–12 tuổi; số liệu xấp xỉ theo cột]\ncar passenger: 1990 ≈ 4.5 → 2010 ≈ 11.3\nwalking: 1990 ≈ 12.5 → 2010 ≈ 6\ncycling: 1990 ≈ 6 → 2010 ≈ 2\nwalking and bus: 1990 ≈ 6 → 2010 ≈ 3\nbus: 1990 ≈ 7 → 2010 ≈ 5\n\nHướng dẫn: 3 đoạn — mở bài paraphrase đề; thân bài 1 mô tả nhóm TĂNG (car passenger — tăng mạnh nhất); thân bài 2 mô tả nhóm GIẢM (walking, cycling, walking and bus, bus) kèm số liệu so sánh; KHÔNG nêu ý kiến cá nhân. Ghi bài viết vào ô bên dưới.',
      minWords: 150,
      options: [],
      correctIndex: -1,
      explanation:
        'Nhận xét giám khảo chính thức (Band 6): các đặc điểm chính được bao quát và làm nổi bật, có overview ở đoạn cuối — nhưng mô tả còn máy móc, số liệu chỉ hỗ trợ một phần, lặp từ “number of trips”, ngữ pháp đơn điệu. Để lên Band 7+: (1) ngay từ câu 2 phải có OVERVIEW rõ (“Overall, car use rose dramatically while every other mode declined…”); (2) nhóm số liệu thay vì liệt kê từng cột; (3) đa dạng cấu trúc so sánh (twice as high as, halved, rose sharply from…to…).',
      pedagogicalTip:
        'Công thức Task 1: Introduction (paraphrase) → Overview (2 xu hướng lớn) → Body 1 (số liệu quan trọng nhất) → Body 2 (phần còn lại). Ưu tiên SO SÁNH (gấp đôi, giảm một nửa) hơn là đọc số thuần.',
      modelAnswer:
        'BÀI LÀM MẪU (nguyên văn thí sinh thật — Band 6, kèm nhận xét giám khảo ở phần giải thích):\n\nThe chart gives you information on how children travelled to and from school in the years 1990 and 2010. The modes of transport were by car, walking, cycling, walking and by bus and by bus only.\n\nA striking feature in this chart is that the number of children who travelled by car has increased from 1990 to 2010. In 1990 the most number of trips per year by children were by walking. However in 2010 it reduced to up to 6 million trips per year. The total number of trips to school by cycling and walking and bus were approximately 6 million in 1990. However the number of trips to school by cycling reduced to 2 million and the number of trips to school by walking and bus reduced to about 3 million in 2010. There isn’t a significant change to the number of trips to school by bus. In 1990 it was about 7 million and in 2010 it came down to approximately 5 million.\n\nIn 1990 the amount of children who travelled to and from school by car was significantly lower than the children who travelled by walking. In contrast in 2010 the number of children who travelled to school by car increased and the number of children walking to school has decreased. In 2010 children travelled to school by bus more than they cycled to school.',
    },

    // ===== WRITING TASK 2 (Academic - essay) =====
    {
      id: 'ielts-w2',
      section: 'writing',
      sectionName: 'Writing - Task 2: Sức khỏe tương lai (Opinion Essay)',
      taskType: 'writing',
      question: 'Writing Task 2 (Academic): essay “sức khỏe trung bình sẽ thấp hơn trong tương lai” — tối thiểu 250 từ (~40 phút).',
      writingPrompt:
        'Writing Task 2 (≥250 từ, ~40 phút)\n\nWrite about the following topic:\n\nThe average standard of people’s health is likely to be lower in the future than it is now.\n\nTo what extent do you agree or disagree with this statement?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nHướng dẫn: nêu quan điểm NGAY ở mở bài (agree/disagree một phần), phát triển 3-4 lý do có ví dụ, xét phản biện ở đoạn riêng rồi bác bỏ, chốt bằng kết luận tóm ý. Ghi bài viết vào ô bên dưới.',
      minWords: 250,
      options: [],
      correctIndex: -1,
      explanation:
        'Nhận xét giám khảo chính thức (Band 7.5): quan điểm rõ từ đầu, lý do được khai thác, có xét quan điểm đối lập rồi bác bỏ; mạch lạc; từ vựng rộng có “softening” (They tend to / This appears to be / might); lỗi chính tả hiếm. Điểm cần cải: lạm dụng từ nối (Firstly/So/Also/Yet) và nên tách đoạn 2-3 cho dễ đọc — muốn đạt 8+ cần phân đoạn gọn hơn và câu đa dạng hơn.',
      pedagogicalTip:
        'Task 2 lấy ý theo công thức P.E.E: Point (lý do) → Explain (giải thích cơ chế) → Example (ví dụ cụ thể). Mỗi đoạn 1 ý, câu chủ đề rõ — giám khảo chấm Coherence & Cohesion rất nặng phần này.',
      modelAnswer:
        'BÀI LÀM MẪU (nguyên văn thí sinh thật — Band 7.5):\n\nRecently, there have been a lot of discussions about health and whether it is going to improve or not. In my opinion, I think that people will become unhealthier in the future than they are now.\n\nThere are many reasons that support the idea of people becoming unhealthy in the future. Firstly, one reason is that of food. People tend to eat more fast food nowadays. They tend to treat themselves with sweets and chocolate whenever they want. This appears to be because people are busier now than they used to be. So, people don’t have a chance to cook or even learn the art of cookery. Also, having a lot of unhealthy food can lead to obesity and it could be a serious issue in the future. Another reason is that technology is developing everyday. Young people enjoy buying new gadgets and the latest devices. This has a negative impact on their health, especially when they enjoy video games. Spending long hours looking at a screen can lead to bad eyesight and obesity as well. Yet another reason is that laziness is a big issue. Different forms of exercise might disappear in the future because people don’t like sports. Also, people prefer spending most of their time on the internet and the internet is growing every single day.\n\nOther people might disagree and say that health will improve in the future. They believe that new sports and new ways to exercise will appear in the future. However, I don’t think it can happen since the majority of people spend less time outdoors. Moreover, other people believe that technology will try and help people improve their health. For example, there have been some games released on the Wii console that makes people exercise but technology is developing more in a negative way. For instance, many phone industries are developing new applications everyday and today’s generation likes to follow every trend. This prevents people to go outside to exercise. They like to spend more time on the internet downloading new programmes or reading gossips about celebraties. This affects people’s health badly.\n\nIn conclusion, I believe that people’s health is affected negatively by fast food, technology and sports and it will be a problem in the future.',
    },

    // ===== SPEAKING PART 1 =====
    {
      id: 'ielts-s1',
      section: 'speaking',
      sectionName: 'Speaking - Part 1: Introduction and Interview',
      taskType: 'speaking',
      question: 'Speaking Part 1 (4–5 phút): giới thiệu & phỏng vấn về quê hương và chỗ ở.',
      speakingPrompt:
        'Part 1 – Introduction and interview (4–5 minutes)\n\nLet’s talk about your home town or village:\n1. What kind of place is it?\n2. What’s the most interesting part of your town/village?\n3. What kind of jobs do the people in your town/village do?\n4. Would you say it’s a good place to live? (Why?)\n\nLet’s move on to talk about accommodation:\n5. Tell me about the kind of accommodation you live in?\n6. How long have you lived there?\n7. What do you like about living there?\n8. What sort of accommodation would you most like to live in?\n\nHướng dẫn: trả lời tự nhiên 2–3 câu mỗi câu hỏi (kèm lý do/ví dụ). Ghi câu trả lời của bạn vào ô bên dưới.',
      prepTimeSeconds: 0,
      options: [],
      correctIndex: -1,
      explanation:
        'Chấm Fluency & Coherence + cách dùng thì: câu hỏi về quê/chỗ ở hiện tại dùng hiện tại đơn; “How long have you lived there?” bắt buộc HIỆN TẠI HOÀN THÀNH (I’ve lived there for…). Tránh trả lời cụt: mỗi câu trả lời = 1 trả lời trực tiếp + 1 lý do/chi tiết.',
      pedagogicalTip:
        'Mẹo “ARE”: Answer → Reason → Example. Ví dụ: “It’s a small quiet village near the city. It’s a good place to live because the neighbours are friendly — for example, everyone helps out at the local festival.”',
      modelAnswer:
        'Gợi ý khung trả lời (dựa trên bản mẫu chính thức của IELTS):\n• Q1: “It’s quite a small village, about 20 km from the city. It’s very quiet — we only have two little shops because most people commute to work in the city.”\n• Q2: “On the top of a hill we have a little castle which is very old and quite well known.”\n• Q3: “We have some farmers in the village as well as people who work in the city as bankers or journalists; there are also teachers and some doctors.”\n• Q4: “Yes. Although it’s very quiet, the people are friendly, so it’s a good place to live.”\n• Q5: “I live in a small flat in a modern block, with a living room, a kitchen and one bedroom.”\n• Q6: “I’ve lived there for about three years — we moved in after I finished university.”\n• Q7: “What I like most is the location — shops and the metro are within walking distance, and the neighbours are quiet.”\n• Q8: “Ideally, I’d like a house with a small garden, because I love growing plants and I want a pet.”',
    },

    // ===== SPEAKING PART 2 =====
    {
      id: 'ielts-s2',
      section: 'speaking',
      sectionName: 'Speaking - Part 2: Individual Long Turn (Cue Card)',
      taskType: 'speaking',
      question: 'Speaking Part 2 (3–4 phút): nói 1–2 phút về “một thứ bạn sở hữu rất quan trọng với bạn”.',
      speakingPrompt:
        'Part 2 – Individual Long Turn (3–4 minutes)\n\nCandidate Task Card\n\nDescribe something you own which is very important to you.\n\nYou should say:\n• where you got it from\n• how long you have had it\n• what you use it for\n\nand explain why it is important to you.\n\nYou will have to talk about the topic for one to two minutes.\nYou have one minute to think about what you’re going to say.\nYou can make some notes to help you if you wish.\n\nRounding off questions:\n1. Is it valuable in terms of money?\n2. Would it be easy to replace?\n\nHướng dẫn: chuẩn bị 1 phút (ghi 4 ý theo cue card), nói 1–2 phút, sau đó trả lời 2 câu hỏi phụ. Ghi dàn ý/câu trả lời vào ô bên dưới.',
      prepTimeSeconds: 60,
      options: [],
      correctIndex: -1,
      explanation:
        'Chấm khả năng độc thoại liền mạch: triển khai ĐỦ 4 gạch đầu dòng của cue card theo thứ tự, biết dùng thời gian (I got it… I have had it for…). Hạn chế “um/ah”, thay bằng cách kéo dài tự nhiên (What I love most is… / The reason it matters is…).',
      pedagogicalTip:
        'Bám 4 gạch đầu dòng như 4 đoạn nhỏ. Mở đầu: “One of the most important things I own is…”. Kết: “That’s why, although it isn’t expensive, it’s irreplaceable to me.”',
      modelAnswer:
        'Bản mẫu chính thức (nguyên văn thí sinh, có transcript của IELTS):\n“One of the most important things I have is my piano because I like playing the piano. I got it from my parents for my twelfth birthday, so I have had it for about nine years, and the reason why it is so important for me is that I can go into another world when I’m playing the piano. I can forget what’s around me and I can forget my problems, and this is sometimes quite good for a few minutes. Or I can play to relax, or just to think of something completely different.”\n\nRounding off:\n• “Is it valuable in terms of money?” — “Probably not very valuable — it’s a simple upright piano — but it means a lot to me.”\n• “Would it be easy to replace?” — “Yes, I think it wouldn’t be that big a problem, but I like my piano as it is, because I got it from my parents — it’s quite unique for me.”',
    },

    // ===== SPEAKING PART 3 =====
    {
      id: 'ielts-s3',
      section: 'speaking',
      sectionName: 'Speaking - Part 3: Two-way Discussion (Values & Advertising)',
      taskType: 'speaking',
      question: 'Speaking Part 3 (4–5 phút): thảo luận về giá trị vật chất và quảng cáo.',
      speakingPrompt:
        'Part 3 – Two-way Discussion (4–5 minutes)\n\nLet’s consider first of all how people’s values have changed:\n1. What kind of things give status to people in your country?\n2. Have things changed since your parents’ time?\n\nFinally, let’s talk about the role of advertising:\n3. Do you think advertising influences what people buy?\n\nHướng dẫn: trả lời theo cấu trúc quan điểm → lý do → ví dụ, và mở rộng bằng cách so sánh quá khứ/hiện tại hoặc dự đoán tương lai. Ghi câu trả lời của bạn vào ô bên dưới.',
      prepTimeSeconds: 0,
      options: [],
      correctIndex: -1,
      explanation:
        'Part 3 chấm tư duy mở rộng: đưa quan điểm, lý do, ví dụ, mặt trái, dự đoán. Chủ đề giá trị vật chất: status symbols, posh cars, designer clothes, show off, environmental problems. Chủ đề quảng cáo: advertising campaigns, impulse buying, brand loyalty, targeted ads, consumer culture.',
      pedagogicalTip:
        'Công thức P.E.D: Point → Evidence → Development. Ví dụ: “I think advertising definitely influences purchases (Point). Businesses spend fortunes on targeted ads (Evidence). For instance, when I see a discounted phone case ad, I often buy it even though I don’t need it — so advertising creates ‘wants’, not just ‘needs’(Development).”',
      modelAnswer:
        'Bản mẫu chính thức (nguyên văn transcript IELTS) — Q1:\n“The first thing which comes to my mind is the car, because lots of people like to have posh cars or expensive cars to show their status, their place in society. Another thing is probably clothing. It starts already when you are young: when children go to school they want to have posh labels on their jumpers or good shoes.”\n\nGợi ý các câu còn lại:\n• Q2: “I don’t think it’s a new development — people have thought like that for quite a long time. What has changed is that advertising now reaches children much earlier.”\n• Q3: “Definitely. And I think this way of thinking isn’t always healthy — buying things can be a replacement for something you don’t have. It’s probably not honest to yourself. In the future, I’m sure clothes will stay status symbols, but cars may change because of environmental problems — it won’t be reasonable to drive a car anymore.”',
    },
  ],
};

export const IELTS_ACADEMIC_SETS: ExamSet[] = [IELTS_ACADEMIC_SET];
