-- =====================================================================
-- V4__seed_major_skill_technology.sql
-- Detailed lookup-catalogue seed for the Information Technology domain only:
--   * major       - university majors / fields of study
--   * skill       - hard / soft / language skills (see skill.type)
--   * technology  - languages, frameworks, platforms & tools
--
-- Every statement uses INSERT IGNORE: these are shared lookup tables that may
-- already carry rows from manual testing (this environment's `major` table
-- already has a "Data Science" row), so a duplicate unique key is silently
-- skipped instead of failing the whole migration.
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. major - IT-related university majors / fields of study
-- ---------------------------------------------------------------------
INSERT IGNORE INTO major (name, description) VALUES
    ('Computer Science', 'Theoretical and practical foundations of computation: algorithms, data structures, computability, and programming.'),
    ('Software Engineering', 'Engineering principles and processes for designing, building, testing, and maintaining large-scale software systems.'),
    ('Information Technology', 'Applied study of computer systems, networks, and infrastructure used to store, process, and deliver information.'),
    ('Information Systems', 'Intersection of business processes and information technology: analysis, design, and management of enterprise systems.'),
    ('Data Science', 'Extracting knowledge and insight from structured and unstructured data using statistics, programming, and domain expertise.'),
    ('Artificial Intelligence', 'Design of intelligent agents and systems: machine learning, neural networks, reasoning, and perception.'),
    ('Computer Engineering', 'Hardware-software co-design: computer architecture, embedded systems, digital circuits, and firmware.'),
    ('Information Security', 'Protecting information systems: cryptography, secure software design, risk management, and incident response.'),
    ('Computer Networks and Data Communications', 'Design, operation, and security of computer networks, protocols, and telecommunication systems.'),
    ('Multimedia Technology', 'Digital media production and technology: graphics, audio/video processing, animation, and interactive content.'),
    ('Embedded Systems and IoT', 'Design and programming of embedded hardware and Internet-of-Things devices and their connected ecosystems.'),
    ('Digital Game Development', 'Game design, game engine programming, graphics rendering, and interactive entertainment software.'),
    ('E-commerce', 'Technology and business practices behind online trading platforms, digital payments, and web-based retail systems.'),
    ('Robotics and Intelligent Systems', 'Design and control of robotic systems combining mechanical engineering, electronics, and AI-driven control software.'),
    ('Cloud Computing and Virtualization Technology', 'Design and operation of cloud infrastructure, virtualization, distributed systems, and scalable services.');

-- ---------------------------------------------------------------------
-- 2. skill - hard skills (IT technical competencies)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO skill (name, type, description) VALUES
    ('Object-Oriented Programming', 'hard', 'Designing software using classes, objects, inheritance, and polymorphism.'),
    ('Data Structures & Algorithms', 'hard', 'Choosing and implementing efficient data structures and algorithms for a problem.'),
    ('Database Design & Normalization', 'hard', 'Modeling relational schemas and applying normal forms to reduce redundancy.'),
    ('RESTful API Design', 'hard', 'Designing resource-oriented, versioned HTTP APIs following REST conventions.'),
    ('Software Architecture Design', 'hard', 'Structuring systems into components, layers, and boundaries to meet quality attributes.'),
    ('Microservices Architecture', 'hard', 'Decomposing systems into independently deployable, loosely coupled services.'),
    ('System Design', 'hard', 'Designing scalable, reliable systems: capacity planning, trade-offs, and component interaction.'),
    ('Unit Testing', 'hard', 'Writing isolated automated tests for individual functions or classes.'),
    ('Test-Driven Development (TDD)', 'hard', 'Writing failing tests before implementation to drive design and correctness.'),
    ('Debugging & Troubleshooting', 'hard', 'Diagnosing and resolving defects in running software using tools and systematic analysis.'),
    ('Version Control & Git Workflow', 'hard', 'Branching strategies, code review, and collaborative history management with Git.'),
    ('CI/CD Pipeline Design', 'hard', 'Automating build, test, and deployment pipelines for fast, reliable releases.'),
    ('Cloud Infrastructure Management', 'hard', 'Provisioning and operating compute, storage, and networking resources on cloud platforms.'),
    ('Containerization & Orchestration', 'hard', 'Packaging applications into containers and managing them at scale (e.g. Kubernetes).'),
    ('Agile/Scrum Methodology', 'hard', 'Iterative delivery using sprints, backlogs, standups, and retrospectives.'),
    ('Code Review', 'hard', 'Evaluating peers'' code for correctness, readability, and adherence to standards.'),
    ('Performance Optimization', 'hard', 'Profiling and tuning applications to reduce latency and resource usage.'),
    ('Secure Coding Practices', 'hard', 'Writing code that avoids common vulnerabilities (OWASP Top 10, injection, XSS, etc.).'),
    ('Machine Learning Model Development', 'hard', 'Training, evaluating, and tuning predictive models on real datasets.'),
    ('Data Analysis & Visualization', 'hard', 'Exploring datasets and communicating insights through charts and dashboards.'),
    ('Natural Language Processing', 'hard', 'Building systems that process and understand human language text.'),
    ('Computer Vision', 'hard', 'Building systems that interpret and analyze visual data from images and video.'),
    ('Mobile App Development', 'hard', 'Building native or cross-platform applications for iOS and Android.'),
    ('Responsive Web Design', 'hard', 'Building web interfaces that adapt correctly across screen sizes and devices.'),
    ('UI/UX Design Principles', 'hard', 'Applying usability, accessibility, and visual design principles to user interfaces.'),
    ('Database Administration', 'hard', 'Installing, tuning, backing up, and securing production database systems.'),
    ('Network Configuration & Administration', 'hard', 'Configuring routers, switches, firewalls, and network services.'),
    ('Penetration Testing', 'hard', 'Simulating attacks to find and report exploitable security weaknesses.'),
    ('Cryptography Fundamentals', 'hard', 'Applying encryption, hashing, and key management to protect data.'),
    ('Technical Documentation Writing', 'hard', 'Writing clear specs, API docs, and runbooks for technical audiences.'),
    ('Requirement Analysis', 'hard', 'Eliciting, clarifying, and documenting stakeholder needs as system requirements.'),
    ('Business Process Modeling', 'hard', 'Mapping and analyzing business workflows to inform system design.'),
    ('Big Data Processing', 'hard', 'Processing large-scale datasets using distributed data processing frameworks.'),
    ('Distributed Systems Design', 'hard', 'Designing systems that operate correctly across multiple networked nodes.'),
    ('Load Balancing & Scalability', 'hard', 'Distributing traffic and scaling systems to handle growing demand.'),
    ('Automated Testing', 'hard', 'Building end-to-end, integration, and regression test suites that run without manual steps.'),
    ('Software Deployment & Release Management', 'hard', 'Planning and executing safe, repeatable production releases.'),
    ('Embedded Systems Programming', 'hard', 'Writing low-level software for microcontrollers and resource-constrained devices.'),
    ('Blockchain Development', 'hard', 'Building smart contracts and decentralized applications on blockchain platforms.');

-- ---------------------------------------------------------------------
-- 3. skill - soft skills (relevant to IT professionals)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO skill (name, type, description) VALUES
    ('Communication Skills', 'soft', 'Clearly conveying technical ideas to both technical and non-technical audiences.'),
    ('Teamwork & Collaboration', 'soft', 'Working effectively with cross-functional teams toward shared goals.'),
    ('Problem Solving', 'soft', 'Breaking down complex problems and reasoning toward practical solutions.'),
    ('Critical Thinking', 'soft', 'Objectively analyzing information and assumptions before acting.'),
    ('Time Management', 'soft', 'Prioritizing tasks and meeting deadlines across concurrent workstreams.'),
    ('Adaptability', 'soft', 'Adjusting quickly to changing requirements, tools, or priorities.'),
    ('Leadership', 'soft', 'Guiding and motivating a team toward a common technical or product goal.'),
    ('Creativity & Innovation', 'soft', 'Generating novel approaches to technical and product challenges.'),
    ('Attention to Detail', 'soft', 'Catching edge cases, inconsistencies, and small errors before they matter.'),
    ('Conflict Resolution', 'soft', 'Mediating and resolving disagreements constructively within a team.'),
    ('Presentation Skills', 'soft', 'Structuring and delivering clear, engaging technical presentations.'),
    ('Mentoring & Coaching', 'soft', 'Helping junior colleagues grow their skills and confidence.'),
    ('Stakeholder Management', 'soft', 'Aligning expectations and communication with project stakeholders.'),
    ('Working Under Pressure', 'soft', 'Maintaining quality and judgment when facing tight deadlines or incidents.'),
    ('Analytical Thinking', 'soft', 'Systematically breaking down data and situations to reach sound conclusions.'),
    ('Decision Making', 'soft', 'Weighing trade-offs and committing to a course of action with incomplete information.'),
    ('Active Listening', 'soft', 'Fully understanding others'' input before responding or acting on it.'),
    ('Emotional Intelligence', 'soft', 'Recognizing and managing one''s own and others'' emotions in a professional setting.');

-- ---------------------------------------------------------------------
-- 4. skill - languages (spoken/written, common in the IT industry)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO skill (name, type, description) VALUES
    ('English', 'language', 'Reading technical documentation and communicating in international teams.'),
    ('Japanese', 'language', 'Common requirement for IT outsourcing and offshore development with Japanese clients.'),
    ('Korean', 'language', 'Common requirement for IT outsourcing and offshore development with Korean clients.'),
    ('Chinese (Mandarin)', 'language', 'Useful for collaboration with mainland China / Taiwan-based teams and clients.'),
    ('French', 'language', 'Useful for collaboration with French-speaking clients and markets.'),
    ('German', 'language', 'Useful for collaboration with German-speaking clients and markets.'),
    ('Vietnamese', 'language', 'Native or working proficiency in Vietnamese.'),
    ('Spanish', 'language', 'Useful for collaboration with Spanish-speaking clients and markets.');

-- ---------------------------------------------------------------------
-- 5. technology - Programming Language
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Java', 'Programming Language', 'General-purpose, object-oriented language widely used for enterprise backend systems.'),
    ('Python', 'Programming Language', 'General-purpose language popular for scripting, data science, and backend development.'),
    ('JavaScript', 'Programming Language', 'Core scripting language of the web, used on both browser and server (Node.js).'),
    ('TypeScript', 'Programming Language', 'Statically typed superset of JavaScript that compiles to plain JavaScript.'),
    ('C', 'Programming Language', 'Low-level procedural language used for systems programming and embedded software.'),
    ('C++', 'Programming Language', 'Systems and application language extending C with object-oriented features.'),
    ('C#', 'Programming Language', 'Object-oriented language for the .NET platform, used for web, desktop, and game development.'),
    ('PHP', 'Programming Language', 'Server-side scripting language widely used for web development.'),
    ('Ruby', 'Programming Language', 'Dynamic, object-oriented language known for developer productivity (Ruby on Rails).'),
    ('Go', 'Programming Language', 'Compiled language designed by Google for simplicity and concurrency at scale.'),
    ('Rust', 'Programming Language', 'Systems language focused on memory safety without a garbage collector.'),
    ('Kotlin', 'Programming Language', 'Modern JVM language, the preferred language for native Android development.'),
    ('Swift', 'Programming Language', 'Apple''s language for iOS, macOS, watchOS, and tvOS application development.'),
    ('Dart', 'Programming Language', 'Client-optimized language used primarily with the Flutter framework.'),
    ('R', 'Programming Language', 'Language and environment for statistical computing and data analysis.'),
    ('Scala', 'Programming Language', 'JVM language blending object-oriented and functional programming, used with Spark.'),
    ('Perl', 'Programming Language', 'Scripting language known for text processing and system administration tasks.'),
    ('Objective-C', 'Programming Language', 'Legacy primary language for Apple platform development before Swift.'),
    ('MATLAB', 'Programming Language', 'Numerical computing language and environment used in engineering and research.'),
    ('SQL', 'Programming Language', 'Declarative language for querying and managing relational databases.'),
    ('Bash Shell Scripting', 'Programming Language', 'Scripting language for automating tasks on Unix-like operating systems.');

-- ---------------------------------------------------------------------
-- 6. technology - Frontend Framework & Library
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('HTML5', 'Frontend Framework & Library', 'Markup language for structuring content on the web.'),
    ('CSS3', 'Frontend Framework & Library', 'Style sheet language for presenting and laying out HTML content.'),
    ('React', 'Frontend Framework & Library', 'Component-based JavaScript library for building user interfaces.'),
    ('Angular', 'Frontend Framework & Library', 'Full-featured TypeScript-based framework for building single-page applications.'),
    ('Vue.js', 'Frontend Framework & Library', 'Progressive JavaScript framework for building user interfaces.'),
    ('Next.js', 'Frontend Framework & Library', 'React framework enabling server-side rendering and static site generation.'),
    ('Nuxt.js', 'Frontend Framework & Library', 'Vue.js framework enabling server-side rendering and static site generation.'),
    ('Svelte', 'Frontend Framework & Library', 'Compiler-based framework that produces highly optimized vanilla JavaScript.'),
    ('jQuery', 'Frontend Framework & Library', 'JavaScript library simplifying DOM manipulation and event handling.'),
    ('Redux', 'Frontend Framework & Library', 'Predictable state management library commonly used with React.'),
    ('Tailwind CSS', 'Frontend Framework & Library', 'Utility-first CSS framework for rapidly building custom designs.'),
    ('Bootstrap', 'Frontend Framework & Library', 'CSS framework providing pre-built responsive UI components.'),
    ('Sass (SCSS)', 'Frontend Framework & Library', 'CSS preprocessor adding variables, nesting, and mixins to stylesheets.'),
    ('Webpack', 'Frontend Framework & Library', 'Module bundler for JavaScript applications and their assets.'),
    ('Vite', 'Frontend Framework & Library', 'Fast frontend build tool and dev server based on native ES modules.'),
    ('Ember.js', 'Frontend Framework & Library', 'Opinionated JavaScript framework for building ambitious web applications.');

-- ---------------------------------------------------------------------
-- 7. technology - Backend Framework
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Spring Boot', 'Backend Framework', 'Java framework for building production-ready, standalone Spring applications.'),
    ('Express.js', 'Backend Framework', 'Minimalist web framework for Node.js.'),
    ('Django', 'Backend Framework', 'High-level Python web framework encouraging rapid, secure development.'),
    ('Flask', 'Backend Framework', 'Lightweight Python web framework for building web applications and APIs.'),
    ('FastAPI', 'Backend Framework', 'Modern, high-performance Python framework for building APIs with type hints.'),
    ('Laravel', 'Backend Framework', 'PHP web framework with expressive syntax for rapid application development.'),
    ('Ruby on Rails', 'Backend Framework', 'Convention-over-configuration web framework for the Ruby language.'),
    ('ASP.NET Core', 'Backend Framework', 'Cross-platform framework for building web apps and APIs on .NET.'),
    ('NestJS', 'Backend Framework', 'Progressive Node.js framework for building scalable server-side applications.'),
    ('Gin', 'Backend Framework', 'High-performance HTTP web framework written in Go.'),
    ('Fiber', 'Backend Framework', 'Express-inspired HTTP web framework built on top of Go''s Fasthttp.'),
    ('Symfony', 'Backend Framework', 'PHP framework and set of reusable components for web applications.');

-- ---------------------------------------------------------------------
-- 8. technology - Mobile Development
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('React Native', 'Mobile Development', 'Framework for building native mobile apps using React and JavaScript.'),
    ('Flutter', 'Mobile Development', 'Google''s UI toolkit for building natively compiled apps from a single Dart codebase.'),
    ('Android (Kotlin/Java)', 'Mobile Development', 'Native Android application development using Kotlin or Java.'),
    ('iOS (Swift/SwiftUI)', 'Mobile Development', 'Native iOS application development using Swift and SwiftUI/UIKit.'),
    ('Xamarin', 'Mobile Development', 'Microsoft framework for building cross-platform apps with C# and .NET.'),
    ('Ionic Framework', 'Mobile Development', 'Framework for building cross-platform mobile apps with web technologies.'),
    ('Jetpack Compose', 'Mobile Development', 'Android''s modern declarative toolkit for building native UI.'),
    ('Kotlin Multiplatform Mobile (KMM)', 'Mobile Development', 'Kotlin technology for sharing code between Android and iOS apps.');

-- ---------------------------------------------------------------------
-- 9. technology - Database (Relational)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('MySQL', 'Database - Relational', 'Popular open-source relational database management system.'),
    ('PostgreSQL', 'Database - Relational', 'Advanced open-source relational database known for standards compliance.'),
    ('Oracle Database', 'Database - Relational', 'Enterprise-grade commercial relational database management system.'),
    ('Microsoft SQL Server', 'Database - Relational', 'Microsoft''s enterprise relational database management system.'),
    ('SQLite', 'Database - Relational', 'Lightweight, file-based embedded relational database engine.'),
    ('MariaDB', 'Database - Relational', 'Open-source relational database, a community-developed fork of MySQL.'),
    ('IBM Db2', 'Database - Relational', 'Enterprise relational database management system from IBM.');

-- ---------------------------------------------------------------------
-- 10. technology - Database (NoSQL)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('MongoDB', 'Database - NoSQL', 'Document-oriented NoSQL database storing data as flexible JSON-like documents.'),
    ('Redis', 'Database - NoSQL', 'In-memory key-value store used for caching, queues, and fast lookups.'),
    ('Apache Cassandra', 'Database - NoSQL', 'Distributed wide-column NoSQL database designed for high availability.'),
    ('Elasticsearch', 'Database - NoSQL', 'Distributed search and analytics engine built on Apache Lucene.'),
    ('Amazon DynamoDB', 'Database - NoSQL', 'Fully managed key-value and document NoSQL database on AWS.'),
    ('Firebase Firestore', 'Database - NoSQL', 'Cloud-hosted NoSQL document database from Google Firebase.'),
    ('Neo4j', 'Database - NoSQL', 'Graph database used for modeling and querying highly connected data.'),
    ('Apache CouchDB', 'Database - NoSQL', 'Document-oriented NoSQL database with an HTTP/JSON API and multi-master replication.');

-- ---------------------------------------------------------------------
-- 11. technology - Cloud Platform
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Amazon Web Services (AWS)', 'Cloud Platform', 'Comprehensive cloud computing platform offering compute, storage, and managed services.'),
    ('Microsoft Azure', 'Cloud Platform', 'Microsoft''s cloud computing platform for building, deploying, and managing applications.'),
    ('Google Cloud Platform (GCP)', 'Cloud Platform', 'Google''s suite of cloud computing services.'),
    ('DigitalOcean', 'Cloud Platform', 'Simplified cloud infrastructure platform popular with startups and developers.'),
    ('Heroku', 'Cloud Platform', 'Platform-as-a-service for deploying and scaling web applications easily.'),
    ('Vercel', 'Cloud Platform', 'Deployment platform optimized for frontend frameworks like Next.js.'),
    ('Netlify', 'Cloud Platform', 'Platform for deploying static sites and serverless functions.'),
    ('IBM Cloud', 'Cloud Platform', 'IBM''s cloud computing platform for enterprise workloads.');

-- ---------------------------------------------------------------------
-- 12. technology - CI/CD & Automation
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Jenkins', 'CI/CD & Automation', 'Open-source automation server for building CI/CD pipelines.'),
    ('GitHub Actions', 'CI/CD & Automation', 'CI/CD and automation platform built into GitHub repositories.'),
    ('GitLab CI/CD', 'CI/CD & Automation', 'CI/CD pipelines built into GitLab for automated testing and deployment.'),
    ('Terraform', 'CI/CD & Automation', 'Infrastructure-as-code tool for provisioning and managing cloud resources.'),
    ('Ansible', 'CI/CD & Automation', 'Agentless automation tool for configuration management and deployment.'),
    ('CircleCI', 'CI/CD & Automation', 'Cloud-based continuous integration and delivery platform.'),
    ('Argo CD', 'CI/CD & Automation', 'Declarative GitOps continuous delivery tool for Kubernetes.'),
    ('Chef', 'CI/CD & Automation', 'Configuration management tool for automating infrastructure setup.'),
    ('Puppet', 'CI/CD & Automation', 'Configuration management platform for automating infrastructure delivery.');

-- ---------------------------------------------------------------------
-- 13. technology - Containerization & Orchestration
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Docker', 'Containerization & Orchestration', 'Platform for building, shipping, and running applications in containers.'),
    ('Kubernetes', 'Containerization & Orchestration', 'Open-source system for automating deployment and scaling of containerized apps.'),
    ('Docker Compose', 'Containerization & Orchestration', 'Tool for defining and running multi-container Docker applications.'),
    ('Red Hat OpenShift', 'Containerization & Orchestration', 'Enterprise Kubernetes platform with developer and operational tooling.'),
    ('Helm', 'Containerization & Orchestration', 'Package manager for Kubernetes applications.');

-- ---------------------------------------------------------------------
-- 14. technology - Version Control
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Git', 'Version Control', 'Distributed version control system for tracking source code changes.'),
    ('GitHub', 'Version Control', 'Web-based hosting service for Git repositories with collaboration tools.'),
    ('GitLab', 'Version Control', 'Web-based DevOps platform with Git repository hosting and CI/CD.'),
    ('Bitbucket', 'Version Control', 'Git repository hosting service by Atlassian, integrated with Jira.'),
    ('Apache Subversion (SVN)', 'Version Control', 'Centralized version control system, predecessor to widespread Git adoption.');

-- ---------------------------------------------------------------------
-- 15. technology - Testing & QA
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('JUnit', 'Testing & QA', 'Unit testing framework for Java applications.'),
    ('Selenium WebDriver', 'Testing & QA', 'Browser automation framework for end-to-end web testing.'),
    ('Jest', 'Testing & QA', 'JavaScript testing framework commonly used with React applications.'),
    ('Cypress', 'Testing & QA', 'End-to-end testing framework for modern web applications.'),
    ('Postman', 'Testing & QA', 'Tool for building, testing, and documenting HTTP APIs.'),
    ('Mockito', 'Testing & QA', 'Mocking framework for unit tests in Java.'),
    ('PyTest', 'Testing & QA', 'Testing framework for Python applications.'),
    ('TestNG', 'Testing & QA', 'Testing framework for Java inspired by JUnit with added features.'),
    ('Cucumber', 'Testing & QA', 'Behavior-driven development tool supporting tests written in plain language.'),
    ('Appium', 'Testing & QA', 'Automation framework for testing native and hybrid mobile applications.');

-- ---------------------------------------------------------------------
-- 16. technology - Message Queue & Streaming
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Apache Kafka', 'Message Queue & Streaming', 'Distributed event streaming platform for high-throughput data pipelines.'),
    ('RabbitMQ', 'Message Queue & Streaming', 'Open-source message broker implementing the AMQP protocol.'),
    ('Apache ActiveMQ', 'Message Queue & Streaming', 'Open-source message broker supporting multiple messaging protocols.'),
    ('Amazon SQS', 'Message Queue & Streaming', 'Fully managed message queuing service on AWS.'),
    ('Apache Pulsar', 'Message Queue & Streaming', 'Distributed pub-sub messaging and streaming platform.');

-- ---------------------------------------------------------------------
-- 17. technology - Data Science & Machine Learning
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('TensorFlow', 'Data Science & Machine Learning', 'Open-source platform for building and training machine learning models.'),
    ('PyTorch', 'Data Science & Machine Learning', 'Open-source machine learning framework popular for research and production.'),
    ('Scikit-learn', 'Data Science & Machine Learning', 'Python library providing simple, efficient tools for classical machine learning.'),
    ('Pandas', 'Data Science & Machine Learning', 'Python library for data manipulation and analysis.'),
    ('NumPy', 'Data Science & Machine Learning', 'Python library for numerical computing with array and matrix support.'),
    ('Keras', 'Data Science & Machine Learning', 'High-level neural networks API running on top of TensorFlow.'),
    ('OpenCV', 'Data Science & Machine Learning', 'Open-source library for real-time computer vision.'),
    ('Hugging Face Transformers', 'Data Science & Machine Learning', 'Library providing pretrained transformer models for NLP and beyond.'),
    ('Apache Spark', 'Data Science & Machine Learning', 'Distributed computing engine for large-scale data processing.'),
    ('Jupyter Notebook', 'Data Science & Machine Learning', 'Interactive computing environment for data exploration and prototyping.');

-- ---------------------------------------------------------------------
-- 18. technology - API & Protocol
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('REST API', 'API & Protocol', 'Architectural style for designing networked HTTP-based APIs.'),
    ('GraphQL', 'API & Protocol', 'Query language and runtime for APIs that lets clients request exactly the data they need.'),
    ('gRPC', 'API & Protocol', 'High-performance RPC framework using Protocol Buffers.'),
    ('WebSocket', 'API & Protocol', 'Protocol enabling full-duplex real-time communication over a single TCP connection.'),
    ('SOAP', 'API & Protocol', 'XML-based protocol for exchanging structured information in web services.'),
    ('OAuth 2.0', 'API & Protocol', 'Authorization framework enabling secure delegated access to resources.');

-- ---------------------------------------------------------------------
-- 19. technology - Web Server
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Nginx', 'Web Server', 'High-performance web server, reverse proxy, and load balancer.'),
    ('Apache HTTP Server', 'Web Server', 'Widely used open-source web server software.'),
    ('Apache Tomcat', 'Web Server', 'Open-source servlet container for running Java web applications.'),
    ('Microsoft IIS', 'Web Server', 'Windows-based web server for hosting .NET and other web applications.');

-- ---------------------------------------------------------------------
-- 20. technology - Build Tool & Package Manager
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Apache Maven', 'Build Tool & Package Manager', 'Build automation and dependency management tool for Java projects.'),
    ('Gradle', 'Build Tool & Package Manager', 'Flexible build automation tool supporting Java, Kotlin, and Android.'),
    ('npm', 'Build Tool & Package Manager', 'Default package manager for the Node.js JavaScript runtime.'),
    ('Yarn', 'Build Tool & Package Manager', 'Fast, reliable package manager for JavaScript projects.'),
    ('pip', 'Build Tool & Package Manager', 'Package installer for Python.'),
    ('Composer', 'Build Tool & Package Manager', 'Dependency manager for PHP.'),
    ('NuGet', 'Build Tool & Package Manager', 'Package manager for .NET projects.');

-- ---------------------------------------------------------------------
-- 21. technology - Design & Prototyping
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Figma', 'Design & Prototyping', 'Collaborative interface design and prototyping tool.'),
    ('Adobe XD', 'Design & Prototyping', 'UI/UX design and prototyping tool from Adobe.'),
    ('Sketch', 'Design & Prototyping', 'Vector-based design tool for digital interfaces, primarily on macOS.'),
    ('InVision', 'Design & Prototyping', 'Digital product design platform for prototyping and collaboration.');

-- ---------------------------------------------------------------------
-- 22. technology - Project Management Tool
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Jira', 'Project Management Tool', 'Issue tracking and agile project management tool by Atlassian.'),
    ('Trello', 'Project Management Tool', 'Kanban-style list-making application for organizing tasks.'),
    ('Confluence', 'Project Management Tool', 'Team workspace and documentation tool by Atlassian.'),
    ('Asana', 'Project Management Tool', 'Work management platform for tracking team tasks and projects.'),
    ('Notion', 'Project Management Tool', 'All-in-one workspace for notes, docs, and project tracking.');

-- ---------------------------------------------------------------------
-- 23. technology - Monitoring & Logging
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Prometheus', 'Monitoring & Logging', 'Open-source monitoring system and time-series database.'),
    ('Grafana', 'Monitoring & Logging', 'Analytics and interactive visualization platform for metrics and logs.'),
    ('Elastic Stack (ELK)', 'Monitoring & Logging', 'Elasticsearch, Logstash, and Kibana used together for log analytics.'),
    ('Datadog', 'Monitoring & Logging', 'Cloud-based monitoring and observability platform.'),
    ('New Relic', 'Monitoring & Logging', 'Application performance monitoring and observability platform.'),
    ('Splunk', 'Monitoring & Logging', 'Platform for searching, monitoring, and analyzing machine-generated data.');

-- ---------------------------------------------------------------------
-- 24. technology - Operating System
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Linux', 'Operating System', 'Open-source Unix-like operating system kernel and family of distributions.'),
    ('Ubuntu Server', 'Operating System', 'Popular Linux distribution widely used for servers.'),
    ('Windows Server', 'Operating System', 'Microsoft''s server operating system family.'),
    ('CentOS', 'Operating System', 'Community-driven, enterprise-class Linux distribution.'),
    ('macOS', 'Operating System', 'Apple''s desktop operating system, commonly used for iOS development.');

-- ---------------------------------------------------------------------
-- 25. technology - Game Development
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Unity', 'Game Development', 'Cross-platform game engine widely used for 2D and 3D game development.'),
    ('Unreal Engine', 'Game Development', 'High-fidelity game engine known for advanced graphics rendering.'),
    ('Godot Engine', 'Game Development', 'Open-source game engine supporting 2D and 3D development.'),
    ('DirectX', 'Game Development', 'Collection of APIs for handling multimedia tasks on Windows, especially graphics.');

-- ---------------------------------------------------------------------
-- 26. technology - Blockchain
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('Solidity', 'Blockchain', 'Programming language for writing smart contracts on Ethereum-compatible blockchains.'),
    ('Ethereum', 'Blockchain', 'Decentralized blockchain platform supporting smart contracts.'),
    ('Hyperledger Fabric', 'Blockchain', 'Permissioned blockchain framework for enterprise use cases.'),
    ('Web3.js', 'Blockchain', 'JavaScript library for interacting with the Ethereum blockchain.');

-- ---------------------------------------------------------------------
-- 27. technology - Security Tool
-- ---------------------------------------------------------------------
INSERT IGNORE INTO technology (name, category, description) VALUES
    ('OWASP ZAP', 'Security Tool', 'Open-source web application security scanner.'),
    ('Burp Suite', 'Security Tool', 'Integrated platform for performing web application security testing.'),
    ('Wireshark', 'Security Tool', 'Network protocol analyzer for capturing and inspecting traffic.'),
    ('Nmap', 'Security Tool', 'Network scanning tool used for discovery and security auditing.'),
    ('Metasploit', 'Security Tool', 'Penetration testing framework for developing and executing exploit code.');

-- =====================================================================
-- End of V4__seed_major_skill_technology.sql
-- =====================================================================
