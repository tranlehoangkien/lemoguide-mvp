package lemonadex.lemoguide.lemoguide_mvp.network;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import org.junit.jupiter.api.*;
import org.mockito.MockedStatic;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;

class NetworkFlowTest {
    JdbcTemplate db;
    NetworkAccess access;
    NetworkPostService posts;
    NetworkProfileService profiles;
    NetworkMessageService messages;
    NetworkReputationService reputation;
    MockedStatic<SecurityUtils> security;
    long viewer=1;

    @BeforeEach void setup() throws Exception {
        db=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:"+UUID.randomUUID()+";MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1","sa",""));
        db.execute("CREATE TABLE account(id BIGINT PRIMARY KEY,status VARCHAR(20),deleted_at TIMESTAMP)");
        db.execute("CREATE TABLE user_information(id BIGINT PRIMARY KEY,account_id BIGINT,full_name VARCHAR(100),avatar_url VARCHAR(200),current_title VARCHAR(100),short_term_goal VARCHAR(100),deleted_at TIMESTAMP)");
        db.execute("CREATE TABLE skill(id BIGINT PRIMARY KEY,name VARCHAR(100))");
        db.execute("CREATE TABLE user_skill(id BIGINT PRIMARY KEY,user_information_id BIGINT,skill_id BIGINT,proficiency_level INT)");
        db.execute("CREATE TABLE project(id BIGINT PRIMARY KEY,user_information_id BIGINT,name VARCHAR(100),description VARCHAR(500),demo_url VARCHAR(500),github_url VARCHAR(500))");
        db.execute("CREATE TABLE technology(id BIGINT PRIMARY KEY,name VARCHAR(100))");
        db.execute("CREATE TABLE project_technology(project_id BIGINT,technology_id BIGINT)");
        db.execute("CREATE TABLE experience_technology(experience_id BIGINT,technology_id BIGINT)");
        db.execute("CREATE TABLE experience(id BIGINT PRIMARY KEY,user_information_id BIGINT,job_title VARCHAR(100),description VARCHAR(500),company_name VARCHAR(100))");
        db.execute("CREATE TABLE certificate(id BIGINT PRIMARY KEY,user_information_id BIGINT,name VARCHAR(100),description VARCHAR(500),credential_url VARCHAR(500),issued_by VARCHAR(100))");
        db.execute("CREATE TABLE career_plan(id BIGINT PRIMARY KEY,account_id BIGINT,target_role VARCHAR(200))");
        db.execute("CREATE TABLE career_task(id BIGINT PRIMARY KEY,plan_id BIGINT,course_id BIGINT,course_title VARCHAR(200),title VARCHAR(100),success_criteria VARCHAR(500),week_number INT,completed BOOLEAN,completed_at TIMESTAMP)");
        String migration=Files.readString(Path.of("src/main/resources/db/migration/V40__lemonetwork.sql")).split("ALTER TABLE ai_prompt_template")[0];
        for(String sql:migration.split(";"))if(!sql.isBlank())db.execute(sql);
        // H2 requires each ADD COLUMN as a separate statement.
        db.execute("ALTER TABLE network_message ADD shared_profile_id BIGINT");
        db.execute("ALTER TABLE network_message ADD shared_project_id BIGINT");
        db.execute(Files.readString(Path.of("src/main/resources/db/migration/V43__network_connection_decline.sql")).replaceAll("(?m)^--.*$",""));
        for(String sql:Files.readString(Path.of("src/main/resources/db/migration/V44__network_community_growth.sql")).replaceAll("(?m)^--.*$","").split(";"))if(!sql.isBlank())db.execute(sql);
        for(String sql:Files.readString(Path.of("src/main/resources/db/migration/V45__network_ecosystem.sql")).split("ALTER TABLE ai_prompt_template")[0].replaceAll("(?m)^--.*$","").split(";"))if(!sql.isBlank())db.execute(sql);
        db.execute("CREATE TABLE system_setting(setting_key VARCHAR(100) PRIMARY KEY,setting_value VARCHAR(500))");
        db.execute("CREATE TABLE cv_profile(id BIGINT PRIMARY KEY,user_information_id BIGINT,template_id BIGINT,cv_data CLOB,active_sections CLOB,avatar_url VARCHAR(500),name VARCHAR(150),target_mode VARCHAR(20),publish_mode VARCHAR(20),share_password_hash VARCHAR(255),share_expires_at TIMESTAMP,is_active BOOLEAN,view_count INT DEFAULT 0,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        for(String sql:Files.readString(Path.of("src/main/resources/db/migration/V49__network_shared_cv.sql")).replaceAll("(?m)^--.*$","").split(";"))if(!sql.isBlank())db.execute(sql);
        for(String sql:Files.readString(Path.of("src/main/resources/db/migration/V46__network_admin_moderation.sql")).replaceAll("(?m)^--.*$","").split(";"))if(!sql.isBlank())db.execute(sql);
        for(long id=1;id<=4;id++) {
            db.update("INSERT INTO account VALUES (?,'active',NULL)",id);
            db.update("INSERT INTO user_information VALUES (?,?,?,NULL,'Developer','Backend',NULL)",id,id,"Person "+id);
            db.update("INSERT INTO network_profile(account_id,handle,published,topics) VALUES (?,?,TRUE,?)",id,"person-"+id,id==1?"Java":"");
        }
        access=new NetworkAccess(db);posts=new NetworkPostService(access);reputation=new NetworkReputationService(access);profiles=new NetworkProfileService(access,reputation);messages=new NetworkMessageService(access);
        security=mockStatic(SecurityUtils.class);security.when(SecurityUtils::currentAccountId).thenAnswer(call->viewer);
    }
    @AfterEach void cleanup(){if(security!=null)security.close();db.execute("DROP ALL OBJECTS");}
    long post(long author,String tags) {viewer=author;return NetworkAccess.number(posts.create(new PostInput("KNOWLEDGE","A useful lesson",tags,null,null,null,null,null)),"id");}

    @Test void personalizedFeedUsesTopicsAndFollowingAndHidesPrivateOrBlockedAuthors() {
        long topic=post(2,"Java"), unrelated=post(3,"Design"),followed=post(4,"SQL");
        viewer=1;profiles.follow(4,true);
        assertEquals(List.of(followed,topic),posts.feed("recommended","",null,0).items().stream().map(p->NetworkAccess.number(p,"id")).toList());
        profiles.block(4,true);db.update("UPDATE network_profile SET published=FALSE WHERE account_id=2");
        var fallback=posts.feed("recommended","",null,0).items();
        assertEquals(1,fallback.size());assertEquals(unrelated,NetworkAccess.number(fallback.getFirst(),"id"));assertEquals("COMMUNITY",fallback.getFirst().get("feed_source"));
        assertThrows(AppException.class,()->posts.get(topic));assertThrows(AppException.class,()->posts.get(followed));
    }

    @Test void paginationKeepsPersonalizedSourceAndDoesNotRepeatPosts() {
        // Seeded directly: 23 posts from one author would (correctly) hit the hourly posting limit.
        for(int i=0;i<23;i++)db.update("INSERT INTO network_post(author_id,kind,content,tags) VALUES (2,'KNOWLEDGE','A useful lesson','Java')");
        post(3,"SQL");viewer=1;
        var first=posts.feed("recommended","",null,0);var second=posts.feed("recommended","",null,first.nextCursor());
        assertEquals(20,first.items().size());assertEquals(3,second.items().size());assertNull(second.nextCursor());
        assertTrue(second.items().stream().allMatch(p->NetworkAccess.number(p,"id")<first.nextCursor()));
    }

    @Test void messageRequestAllowsOneOpeningMessageAndConnectionAcceptUnlocksChat() {
        long thread=NetworkAccess.number(messages.open(2),"id");
        messages.send(thread,new MessageInput("Hello",null,null,null,null));
        assertThrows(AppException.class,()->messages.send(thread,new MessageInput("Again",null,null,null,null)));
        viewer=2;assertThrows(AppException.class,()->messages.send(thread,new MessageInput("Reply",null,null,null,null)));
        viewer=1;profiles.connect(2,"request");assertEquals(1,profiles.people("","sent",0).items().size());
        viewer=2;profiles.connect(1,"accept");messages.send(thread,new MessageInput("Welcome",null,null,null,null));
        assertEquals("ACCEPTED",messages.get(thread,0).get("status"));
        viewer=3;assertThrows(AppException.class,()->messages.get(thread,0));
    }

    @Test void sharedProjectRequiresBothViewersAccessAndDisappearsWhenUnpublished() {
        db.update("INSERT INTO project VALUES (10,3,'Public API','Evidence','https://example.com',NULL)");
        db.update("INSERT INTO network_shared_item VALUES (3,'PROJECT',10)");
        long thread=NetworkAccess.number(messages.open(2),"id");
        messages.send(thread,new MessageInput("See this project",null,3L,10L,null));
        viewer=2;var received=(List<Map<String,Object>>)messages.get(thread,0).get("messages");
        assertNotNull(received.getFirst().get("shared_profile"));
        db.update("DELETE FROM network_shared_item WHERE account_id=3");
        received=(List<Map<String,Object>>)messages.get(thread,0).get("messages");assertNull(received.getFirst().get("shared_profile"));
        messages.decide(thread,true);viewer=1;
        assertThrows(AppException.class,()->messages.send(thread,new MessageInput("Private project",null,3L,10L,null)));
        db.update("INSERT INTO network_block VALUES (2,3)");
        assertThrows(AppException.class,()->messages.send(thread,new MessageInput("Blocked profile",null,3L,null,null)));
    }

    @Test void publicProfileOnlyIncludesExplicitlySharedItemsAndGoalConsent() {
        db.update("INSERT INTO project VALUES (10,2,'Private API','Private description',NULL,NULL)");
        var profile=profiles.profile("person-2");
        assertNull(profile.get("goal"));assertTrue(((List<?>)profile.get("items")).isEmpty());
        db.update("INSERT INTO network_shared_item VALUES (2,'PROJECT',10)");
        assertEquals(1,((List<?>)profiles.profile("person-2").get("items")).size());
        assertThrows(AppException.class,()->profiles.save(new Settings("person-1",true,"","",false,false,true,false,null,List.of(new Shared("PROJECT",10)),null)));
    }

    @Test void comparisonRequiresConsentAndPreviewOnlyReturnsSelectedLearningGoals() {
        var mapper=new tools.jackson.databind.ObjectMapper();
        var runner=mock(lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvAiTaskRunner.class);
        var snapshots=mock(lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service.ProfileSnapshotBuilder.class);
        var repository=mock(lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository.class);
        var plans=mock(lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerPlanService.class);
        var recommendations=mock(lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService.class);
        var learning=new NetworkLearningService(access,mapper,runner,snapshots,repository,plans,recommendations);
        var request=new CompareInput("Build a Backend portfolio",null);
        assertThrows(AppException.class,()->learning.compare(2,request));verifyNoInteractions(runner);
        db.update("UPDATE network_profile SET allow_compare=TRUE WHERE account_id=2");
        db.update("INSERT INTO project VALUES (10,2,'Public API','Public evidence','https://example.com',NULL)");
        db.update("INSERT INTO project VALUES (11,2,'Secret project','Never share this',NULL,NULL)");
        db.update("INSERT INTO network_shared_item VALUES (2,'PROJECT',10)");
        var own=new lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation();
        when(repository.findByAccountId(1L)).thenReturn(Optional.of(own));
        when(snapshots.build(own)).thenReturn(new lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service.ProfileSnapshotBuilder.ProfileSnapshot("Basic Java",false));
        var analysis=new NetworkLearningService.Analysis("Learning suggestions",List.of(
            new NetworkLearningService.Difference("Java","Self reported","Public API","Public API project","Build a tested API"),
            new NetworkLearningService.Difference("SQL","No evidence","Public API","Public API project","Design a database")));
        doAnswer(call->{String prompt=call.getArgument(4);assertTrue(prompt.contains("Public API"));assertFalse(prompt.contains("Secret project"));assertFalse(prompt.contains("Person 2"));
            return new lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvAiTaskRunner.Outcome<>(analysis,1L,null);
        }).when(runner).run(any(),any(),any(),any(),anyString(),anyString(),any());
        when(recommendations.forPlan(any())).thenReturn(new lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService.Recommendations(List.of(),List.of()));
        when(plans.list(any())).thenReturn(org.springframework.data.domain.Page.empty());
        long comparison=NetworkAccess.number(learning.compare(2,request),"id");
        var seed=learning.preview(comparison,new ApplyInput(List.of(0)));
        assertTrue(seed.get("constraints").toString().contains("Build a tested API"));
        assertFalse(seed.get("constraints").toString().contains("Design a database"));
        assertEquals(0,access.count("SELECT COUNT(*) FROM career_plan"));
        assertEquals(0,access.count("SELECT COUNT(*) FROM user_skill"));
        verify(plans).list(any());verifyNoMoreInteractions(plans);
        viewer=3;assertThrows(AppException.class,()->learning.preview(comparison,new ApplyInput(List.of(0))));viewer=1;
        db.update("UPDATE network_profile SET allow_compare=FALSE WHERE account_id=2");
        assertThrows(AppException.class,()->learning.preview(comparison,new ApplyInput(List.of(0))));
    }

    @Test void moderationHidesReportedContentAndKeepsDecisionHistory() {
        long id=post(2,"Java");viewer=1;
        var moderation=new NetworkModerationService(access,messages);
        moderation.report(new ReportInput("POST",id,"Spam"));
        long report=NetworkAccess.number(moderation.reports().getFirst(),"id");
        moderation.decide(report,"HIDE");
        assertThrows(AppException.class,()->posts.get(id));
        assertEquals("HIDE",moderation.reports().getFirst().get("status"));
        assertThrows(AppException.class,()->moderation.decide(report,"DISMISS"));
    }

    @Test void declinedRequestHasCooldownResendDoesNotStackNotificationsAndHiddenRequestStaysRemovable() {
        viewer=1;profiles.connect(2,"request");
        viewer=2;assertEquals(1L,profiles.summary().get("requests"));
        profiles.connect(1,"remove");
        assertEquals(0L,profiles.summary().get("requests"));
        viewer=1;assertThrows(AppException.class,()->profiles.connect(2,"request"));
        // Cancelling your own request starts no cooldown, and re-sending does not add a second unread notification.
        profiles.connect(3,"request");profiles.connect(3,"remove");profiles.connect(3,"request");
        assertEquals(1L,db.queryForObject("SELECT COUNT(*) FROM network_notification WHERE recipient_id=3 AND kind='CONNECTION'",Long.class));
        db.update("UPDATE network_profile SET published=FALSE WHERE account_id=3");
        profiles.connect(3,"remove");
        assertEquals(0L,db.queryForObject("SELECT COUNT(*) FROM network_connection WHERE low_id=1 AND high_id=3",Long.class));
    }

    @Test void peopleCarryConnectionAndFollowStateForCardActions() {
        viewer=1;profiles.connect(2,"request");profiles.follow(3,true);
        var people=profiles.people("","discover",0).items();
        var two=people.stream().filter(p->NetworkAccess.number(p,"account_id")==2).findFirst().orElseThrow();
        var three=people.stream().filter(p->NetworkAccess.number(p,"account_id")==3).findFirst().orElseThrow();
        assertEquals("PENDING",((Map<?,?>)two.get("connection")).get("status"));
        assertEquals(Boolean.FALSE,two.get("following"));
        assertNull(three.get("connection"));
        assertEquals(Boolean.TRUE,three.get("following"));
    }

    @Test void summaryCountsUnreadMessagesAndNotifications() {
        long thread=NetworkAccess.number(messages.open(2),"id");
        messages.send(thread,new MessageInput("Hello",null,null,null,null));
        viewer=2;var summary=profiles.summary();
        assertEquals(1L,summary.get("messages"));
        assertEquals(1L,summary.get("notifications")); // the MESSAGE notification
        viewer=1;profiles.follow(2,true);
        viewer=2;assertEquals(2L,profiles.summary().get("notifications"));
    }

    long notifications(long recipient,String kind){return db.queryForObject("SELECT COUNT(*) FROM network_notification WHERE recipient_id=? AND kind=?",Long.class,recipient,kind);}

    /** Roadmap for `account`: weeks 1-2 in course 5 (week 1 done), week 3 self-study. */
    void plan(long account,String role) {
        db.update("INSERT INTO career_plan VALUES (?,?,?)",account,account,role);
        db.update("INSERT INTO career_task VALUES (?,?,5,'JUnit 5',?,'Tests pass',1,TRUE,CURRENT_TIMESTAMP)",account*10+1,account,"Unit test");
        db.update("INSERT INTO career_task VALUES (?,?,5,'JUnit 5',?,'Mocks',2,FALSE,NULL)",account*10+2,account,"Mockito");
        db.update("INSERT INTO career_task VALUES (?,?,NULL,NULL,?,'Ship',3,FALSE,NULL)",account*10+3,account,"Capstone");
    }

    @Test void editsRepliesAndMentionsNotifyOnceAndRepliesStayOneLevelDeep() {
        long id=post(1,"Java");
        viewer=1;posts.edit(id,new PostEdit("Updated lesson, thanks @person-2","Java",null,null));
        assertEquals(1L,notifications(2,"MENTION"));
        posts.edit(id,new PostEdit("Updated again, thanks @person-2","Java",null,null));
        assertEquals(1L,notifications(2,"MENTION"),"an edit must not re-notify an existing mention");
        assertNotNull(posts.get(id).get("edited_at"));
        assertEquals(Set.of("person-3"),NetworkAccess.handles("Use @ParameterizedTest, ping @person-3, not @person-4ABC or mail@person-4"));
        viewer=2;posts.comment(id,new CommentInput("Top level",null));
        long top=db.queryForObject("SELECT MAX(id) FROM network_comment",Long.class);
        viewer=3;posts.comment(id,new CommentInput("Reply",top));
        long reply=db.queryForObject("SELECT MAX(id) FROM network_comment",Long.class);
        viewer=4;posts.comment(id,new CommentInput("Reply to reply",reply));
        assertEquals(top,db.queryForObject("SELECT parent_id FROM network_comment WHERE content='Reply to reply'",Long.class));
        assertEquals(1L,notifications(2,"REPLY"),"the top-level author hears about the direct reply");
        assertEquals(1L,notifications(3,"REPLY"),"replying to a reply notifies that reply's author");
        var page=posts.comments(id,0).items();
        assertEquals(1,page.size());
        assertEquals(2,((List<?>)page.getFirst().get("replies")).size());
        viewer=2;posts.editComment(id,top,"Top level, edited");
        viewer=3;assertThrows(AppException.class,()->posts.editComment(id,top,"Not mine"));
    }

    @Test void postingIsRateLimited() {
        for(int i=0;i<10;i++) post(1,"");
        assertThrows(AppException.class,()->post(1,""));
    }

    @Test void cohortsAreOptInOnlyForYourOwnRoadmapAndCountUnreadAndCheckinsOncePerDay() {
        var cohorts=new NetworkCohortService(access);
        plan(1,"Backend Developer");plan(2,"backend  developer ");
        viewer=3;assertThrows(AppException.class,()->cohorts.join("COURSE","5"));
        viewer=1;var overview=cohorts.overview();
        assertEquals(2,((List<?>)overview.get("candidates")).size());
        long course=NetworkAccess.number((Map<String,Object>)cohorts.join("COURSE","5").get("cohort"),"id");
        viewer=2;cohorts.join("COURSE","5");cohorts.join("ROLE","backend developer");
        viewer=1;cohorts.send(course,"Chào cả nhóm");
        viewer=2;assertEquals(1L,profiles.summary().get("cohorts"));
        var detail=cohorts.get(course,0);
        var members=(List<Map<String,Object>>)detail.get("members");
        assertEquals(2,members.size());
        assertEquals(50L,((Map<?,?>)members.getFirst().get("progress")).get("percent"),"course cohort shows progress within that course");
        cohorts.checkin(course,"Đang làm Mockito");
        assertTrue(db.queryForObject("SELECT content FROM network_cohort_message WHERE kind='CHECKIN'",String.class).contains("1/2"));
        assertThrows(AppException.class,()->cohorts.checkin(course,null));
        viewer=3;assertThrows(AppException.class,()->cohorts.get(course,0));
    }

    @Test void buddyPairsAreExclusiveNudgeOncePerDayAndMilestonesAutoShare() {
        var cohorts=new NetworkCohortService(access);var buddies=new NetworkBuddyService(access);
        plan(1,"Backend");plan(2,"Backend");plan(3,"Backend");
        for(long id=1;id<=3;id++){viewer=id;cohorts.join("ROLE","backend developer");}
        viewer=1;var suggestions=(List<Map<String,Object>>)buddies.overview().get("suggestions");
        assertEquals(2,suggestions.size());
        assertEquals("Backend Developer",suggestions.getFirst().get("shared_cohort"),"a suggestion says which cohort you share");
        buddies.act(2,"request");buddies.act(3,"request");
        viewer=2;buddies.act(1,"accept");
        assertEquals(0L,db.queryForObject("SELECT COUNT(*) FROM network_buddy WHERE status='PENDING'",Long.class),"accepting drops other pending invitations");
        viewer=3;assertThrows(AppException.class,()->buddies.act(1,"request"));
        viewer=1;assertNotNull(buddies.overview().get("buddy"));
        buddies.nudge();assertThrows(AppException.class,buddies::nudge);
        assertEquals(1L,notifications(2,"NUDGE"));
        db.update("UPDATE network_profile SET auto_share_milestones=TRUE WHERE account_id=1");
        var listener=new NetworkMilestoneListener(access,buddies);
        listener.share(1,11);listener.share(1,11);
        assertEquals(1L,db.queryForObject("SELECT COUNT(*) FROM network_post WHERE author_id=1 AND kind='MILESTONE'",Long.class));
        assertEquals(1L,notifications(2,"BUDDY_MILESTONE"));
        listener.share(1,12);
        assertEquals(1L,db.queryForObject("SELECT COUNT(*) FROM network_post WHERE author_id=1 AND kind='MILESTONE'",Long.class),"unfinished weeks are never shared");
    }

    @Test void companyPeopleMatchSharedExperienceIgnoringLegalForm() {
        db.update("INSERT INTO experience VALUES (7,2,'Dev','',  'Nhật Minh Soft')");
        db.update("INSERT INTO network_shared_item VALUES (2,'EXPERIENCE',7)");
        db.update("INSERT INTO experience VALUES (8,3,'Dev','','Nhật Minh Soft')");
        viewer=1;
        var people=profiles.companyPeople("Công ty Cổ phần Nhật Minh Soft");
        assertEquals(List.of(2L),people.stream().map(p->NetworkAccess.number(p,"account_id")).toList(),"only explicitly shared experience counts");
        assertEquals("nhật minh soft",NetworkProfileService.companyKey("CÔNG TY TNHH Nhật Minh Soft"));
    }

    @Test void streakAndImageSniffing() {
        var today=java.time.LocalDate.of(2026,9,23);
        Set<Long> weeks=new HashSet<>(List.of(NetworkAccess.weekKey(today.minusWeeks(1)),NetworkAccess.weekKey(today.minusWeeks(2))));
        assertEquals(2,NetworkAccess.streak(weeks,today),"an empty current week does not break the streak yet");
        weeks.add(NetworkAccess.weekKey(today));
        assertEquals(3,NetworkAccess.streak(weeks,today));
        assertEquals(".png",NetworkImageStorage.extension(new byte[]{(byte)0x89,'P','N','G',0x0D,0x0A,0x1A,0x0A,0,0,0,0},12));
        assertNull(NetworkImageStorage.extension("<svg onload=x>".getBytes(),12));
        assertEquals("/uploads/network/123e4567-e89b-12d3-a456-426614174000.png",NetworkAccess.imageUrl("/uploads/network/123e4567-e89b-12d3-a456-426614174000.png"));
        assertThrows(AppException.class,()->NetworkAccess.imageUrl("/uploads/avatars/../../etc/passwd"));
    }

    @Test void targetRoleWordingAndSeniorityVariantsShareOneCohort() {
        for(String role:List.of("Backend Developer cấp độ Junior","Lập trình viên Backend","Back-end Engineer (Java)","Senior backend developer","Kỹ sư phần mềm Backend"))
            assertEquals(new CareerRoleNormalizer.Role("Backend Developer","backend developer"),CareerRoleNormalizer.normalize(role),role);
        assertEquals("Fullstack Developer",CareerRoleNormalizer.normalize("Full-stack Developer (React + Spring)").title(),"fullstack wins over its frontend/backend parts");
        assertEquals("Mobile Developer",CareerRoleNormalizer.normalize("Lập trình viên React Native").title());
        assertEquals("Data Analyst",CareerRoleNormalizer.normalize("Chuyên viên phân tích dữ liệu Fresher").title());
        assertEquals("QA/Tester",CareerRoleNormalizer.normalize("Tester thực tập sinh").title());
        assertEquals("UI/UX Designer",CareerRoleNormalizer.normalize("Junior UI/UX Designer").title());
        assertEquals("Chuyên viên tuyển dụng",CareerRoleNormalizer.normalize("Chuyên viên tuyển dụng cấp độ Junior").title(),"unknown roles keep their wording minus seniority");
        assertEquals("",CareerRoleNormalizer.normalize("  ").key());

        var cohorts=new NetworkCohortService(access);
        plan(1,"Backend Developer cấp độ Junior");plan(2,"Lập trình viên Backend");
        viewer=1;var mine=(List<Map<String,Object>>)cohorts.overview().get("candidates");
        var role=mine.stream().filter(c->"ROLE".equals(c.get("kind"))).findFirst().orElseThrow();
        assertEquals("Backend Developer",role.get("title"));
        long id=NetworkAccess.number((Map<String,Object>)cohorts.join("ROLE",role.get("ref_key").toString()).get("cohort"),"id");
        viewer=2;assertEquals(id,NetworkAccess.number((Map<String,Object>)cohorts.join("ROLE","backend developer").get("cohort"),"id"),"differently worded roadmaps land in the same cohort");
    }

    void connect(long a,long b){viewer=a;profiles.connect(b,"request");viewer=b;profiles.connect(a,"accept");}

    @Test void mentoringGoesFromRequestToScheduledToRatedAndCountsForTheMentor() {
        var mentoring=new NetworkMentorService(access);
        viewer=1;assertThrows(AppException.class,()->mentoring.request(2,new MentorRequestInput("Spring","Help me")),"not a mentor yet");
        db.update("UPDATE network_profile SET available_to_help=TRUE,mentor_topics='Java, Spring' WHERE account_id=2");
        var mentors=mentoring.mentors("");
        assertEquals(2L,NetworkAccess.number(mentors.getFirst(),"account_id"));
        assertEquals(List.of("java"),mentors.getFirst().get("matched"),"person 1 follows the Java topic");
        long id=NetworkAccess.number(mentoring.request(2,new MentorRequestInput("Spring Security","Could you review my login flow?")),"id");
        assertThrows(AppException.class,()->mentoring.request(2,new MentorRequestInput("Again","Again")),"one open request per mentor");
        viewer=2;assertEquals(1L,profiles.summary().get("mentoring"));
        viewer=3;assertThrows(AppException.class,()->mentoring.schedule(id,new MentorSchedule(java.time.OffsetDateTime.now().plusDays(1),null,null)));
        viewer=2;assertThrows(AppException.class,()->mentoring.schedule(id,new MentorSchedule(java.time.OffsetDateTime.now().minusHours(1),null,null)));
        mentoring.schedule(id,new MentorSchedule(java.time.OffsetDateTime.now().plusDays(1),"https://meet.example.com/abc","Mang theo repo"));
        assertEquals("ACCEPTED",db.queryForObject("SELECT status FROM network_thread WHERE low_id=1 AND high_id=2",String.class),"scheduling opens the chat");
        assertEquals(1,notifications(1,"MENTOR_ACCEPTED"));
        viewer=1;assertThrows(AppException.class,()->mentoring.complete(id,new MentorComplete(5,"")),"cannot rate before the session");
        db.update("UPDATE network_mentor_request SET scheduled_at=? WHERE id=?",java.time.LocalDateTime.now().minusHours(2),id);
        assertEquals(true,((List<Map<String,Object>>)mentoring.overview().get("outgoing")).getFirst().get("due"));
        mentoring.complete(id,new MentorComplete(5,"Rất rõ ràng"));
        assertEquals(1,notifications(2,"MENTOR_COMPLETED"));
        assertThrows(AppException.class,()->mentoring.cancel(id),"finished sessions cannot be cancelled");
        var points=reputation.contributions(2);
        assertEquals(1L,points.get("mentor_sessions"));assertEquals(5.0,points.get("mentor_rating"));assertEquals(15L,points.get("points"));
        assertNull(profiles.profile("person-2").get("mentor_request"),"a completed session no longer blocks a new request");
    }

    @Test void onlyConnectionsEndorseSharedItemsAndCountsIgnoreHiddenEndorsers() {
        db.update("INSERT INTO project VALUES (10,2,'Public API','Evidence',NULL,NULL)");
        db.update("INSERT INTO project VALUES (11,2,'Private API','Hidden',NULL,NULL)");
        db.update("INSERT INTO network_shared_item VALUES (2,'PROJECT',10)");
        viewer=1;assertThrows(AppException.class,()->reputation.endorse(2,"PROJECT",10,true),"not connected");
        connect(1,2);connect(3,2);
        viewer=1;reputation.endorse(2,"PROJECT",10,true);reputation.endorse(2,"PROJECT",10,true);
        assertThrows(AppException.class,()->reputation.endorse(2,"PROJECT",11,true),"item not shared");
        assertThrows(AppException.class,()->reputation.endorse(2,"EXPERIENCE",10,true));
        viewer=3;reputation.endorse(2,"PROJECT",10,true);
        assertEquals(2,notifications(2,"ENDORSE"));
        viewer=1;var item=((List<Map<String,Object>>)profiles.profile("person-2").get("items")).getFirst();
        assertEquals(2,item.get("endorsement_count"));assertEquals(true,item.get("endorsed"));assertEquals(true,item.get("can_endorse"));
        db.update("UPDATE network_profile SET published=FALSE WHERE account_id=3");
        item=((List<Map<String,Object>>)profiles.profile("person-2").get("items")).getFirst();
        assertEquals(1,item.get("endorsement_count"),"endorsers who left the community are not counted");
        viewer=2;assertEquals(false,((List<Map<String,Object>>)profiles.profile("person-2").get("items")).getFirst().get("can_endorse"));
        viewer=1;reputation.endorse(2,"PROJECT",10,false);
        viewer=2;assertEquals(0,((List<Map<String,Object>>)profiles.profile("person-2").get("items")).getFirst().get("endorsement_count"));
    }

    @Test void feedbackPostsCollectHelpfulReviewsAndAcceptedAnswersNotifyTheirAuthor() {
        db.update("INSERT INTO project VALUES (10,2,'Portfolio','Demo',NULL,NULL)");
        db.update("INSERT INTO network_shared_item VALUES (2,'PROJECT',10)");
        viewer=2;assertThrows(AppException.class,()->posts.create(new PostInput("FEEDBACK","Please review",null,null,null,10L,null,"")),"needs an aspect");
        assertThrows(AppException.class,()->posts.create(new PostInput("FEEDBACK","Please review",null,null,null,10L,null,"SECURITY")));
        long id=NetworkAccess.number(posts.create(new PostInput("FEEDBACK","Please review",null,null,null,10L,null,"ui, code")),"id");
        assertEquals("CODE,UI",posts.get(id).get("feedback_aspects"));
        viewer=3;posts.comment(id,new CommentInput("README cần thêm hướng dẫn chạy",null));
        long comment=db.queryForObject("SELECT MAX(id) FROM network_comment",Long.class);
        assertThrows(AppException.class,()->posts.helpful(id,comment,true),"only the post author marks feedback");
        viewer=2;posts.helpful(id,comment,true);posts.helpful(id,comment,true);
        assertEquals(1,notifications(3,"FEEDBACK_HELPFUL"));
        assertEquals(true,posts.comments(id,0).items().getFirst().get("helpful"));
        assertEquals(1L,reputation.contributions(3).get("helpful_feedback"));

        long question=NetworkAccess.number(posts.create(new PostInput("QUESTION","Why does my test fail?",null,null,null,null,null,null)),"id");
        viewer=4;posts.comment(question,new CommentInput("Mock the clock",null));
        long answer=db.queryForObject("SELECT MAX(id) FROM network_comment",Long.class);
        viewer=2;posts.accept(question,answer,true);posts.accept(question,answer,true);
        assertEquals(1,notifications(4,"ANSWER_ACCEPTED"));
        assertEquals(10L,reputation.contributions(4).get("points"));
    }

    @Test void challengeEntriesVoteWhileOpenAndHighlightTheTopEntryAfterwards() {
        var challenges=new NetworkChallengeService(access);
        var today=java.time.LocalDate.now();
        assertThrows(AppException.class,()->challenges.create(new ChallengeInput("Unit test","Viết 5 unit test","",today,today.minusDays(1))));
        assertThrows(AppException.class,()->challenges.create(new ChallengeInput("Unit test","Viết 5 unit test","",today,today.plusDays(40))));
        long id=NetworkAccess.number(challenges.create(new ChallengeInput("Unit test","Viết 5 unit test","Testing",today.minusDays(1),today.plusDays(5))),"id");
        viewer=1;challenges.submit(id,new EntryInput("Draft",null));challenges.submit(id,new EntryInput("Final","https://github.com/a/b"));
        assertEquals(1,access.count("SELECT COUNT(*) FROM network_challenge_entry WHERE challenge_id=?",id),"one entry per member, edited in place");
        assertThrows(AppException.class,()->challenges.submit(id,new EntryInput("Bad link","javascript:alert(1)")));
        viewer=2;challenges.submit(id,new EntryInput("Mine",null));
        long first=db.queryForObject("SELECT id FROM network_challenge_entry WHERE account_id=1",Long.class),second=db.queryForObject("SELECT id FROM network_challenge_entry WHERE account_id=2",Long.class);
        assertThrows(AppException.class,()->challenges.vote(second,true),"no self votes");
        viewer=1;challenges.vote(second,true);viewer=3;challenges.vote(second,true);challenges.vote(first,true);
        viewer=1;var open=(List<Map<String,Object>>)challenges.list().get("open");
        assertEquals(true,open.getFirst().get("joined"));assertEquals(2L,open.getFirst().get("entries"));
        db.update("UPDATE network_challenge SET starts_on=?,ends_on=? WHERE id=?",today.minusDays(8),today.minusDays(1),id);
        assertThrows(AppException.class,()->challenges.vote(first,false),"votes close with the challenge");
        assertThrows(AppException.class,()->challenges.withdraw(id));
        var entries=(List<Map<String,Object>>)challenges.get(id).get("entries");
        assertEquals(2L,NetworkAccess.number(entries.getFirst(),"account_id"));assertEquals(true,entries.getFirst().get("highlight"));assertEquals(false,entries.get(1).get("highlight"));
        assertEquals(1L,reputation.contributions(2).get("challenge_highlights"));assertEquals(0L,reputation.contributions(1).get("challenge_highlights"));
        assertEquals(1L,reputation.contributions(1).get("challenges"));
        var moderation=new NetworkModerationService(access,messages);
        moderation.report(new ReportInput("CHALLENGE_ENTRY",second,"Copied"));
        moderation.decide(NetworkAccess.number(moderation.reports().getFirst(),"id"),"HIDE");
        assertEquals(1,((List<?>)challenges.get(id).get("entries")).size());
    }

    @Test void aiDraftIsCachedPerQuestionVersionAndSummariesNeverSendMemberNames() {
        var mapper=new tools.jackson.databind.ObjectMapper();
        var runner=mock(lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvAiTaskRunner.class);
        var assist=new NetworkAssistService(access,mapper,runner);
        List<String> prompts=new ArrayList<>();
        doAnswer(call->{String prompt=call.getArgument(4);prompts.add(prompt);
            String raw=prompt.contains("câu trả lời nháp")?"{\"answer\":\"Hãy kiểm tra cấu hình datasource trong application.yaml\",\"caveats\":\"\"}"
                :prompt.contains("tóm tắt")?"{\"summary\":\"Mọi người gợi ý kiểm tra cấu hình\",\"points\":[\"Kiểm tra datasource\"],\"openQuestions\":[]}"
                :"{\"tags\":[\"#Java\",\"java\",\"Spring Boot\",\"a,b\",\"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"]}";
            java.util.function.Function<String,Object> parser=call.getArgument(6);
            return new lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvAiTaskRunner.Outcome<>(parser.apply(raw),1L,null);
        }).when(runner).run(any(),any(),any(),any(),anyString(),anyString(),any());
        viewer=2;long question=NetworkAccess.number(posts.create(new PostInput("QUESTION","Spring Boot không kết nối được MySQL","Spring Boot",null,null,null,null,null)),"id");
        viewer=1;var notes=assist.draft(question,null);assist.draft(question,null);
        assertEquals(1,prompts.size(),"the second request reuses the cached draft");
        assertTrue(((Map<?,?>)notes.get("draft")).get("answer").toString().contains("datasource"));
        assertThrows(AppException.class,()->assist.summarize(question,null),"too few comments");
        for(long who=3;who<=4;who++)for(int i=0;i<3;i++){viewer=who;posts.comment(question,new CommentInput("Thử cách "+i,null));}
        viewer=1;assertNotNull(assist.summarize(question,null).get("summary"));
        String summaryPrompt=prompts.getLast();
        assertTrue(summaryPrompt.contains("Thành viên 1"));assertFalse(summaryPrompt.contains("Person 3"));assertFalse(summaryPrompt.contains("person-3"));
        viewer=2;posts.edit(question,new PostEdit("Spring Boot 3 không kết nối được MySQL 8","Spring Boot",null,null));
        viewer=1;assertNull(assist.notes(question).get("draft"),"an edited question needs a new draft");
        assertEquals(List.of("Java","Spring Boot","a b"),assist.tags("Học Spring Boot",null));
        for(int i=0;i<10;i++)db.update("INSERT INTO network_ai_request(account_id,kind) VALUES (1,'TAGS')");
        assertThrows(AppException.class,()->assist.tags("Học Spring Boot",null),"hourly limit");
    }

    @Test void adminRestoresOnlyWhatModeratorsHidAndListsMembersAndPosts() {
        db.execute("ALTER TABLE account ADD email VARCHAR(100)");db.execute("ALTER TABLE account ADD created_at TIMESTAMP");
        var admin=new NetworkAdminService(access);
        long reported=post(2,"Java"),deleted=post(3,"SQL"),direct=post(4,"Go");
        viewer=3;posts.remove(deleted);
        viewer=1;var moderation=new NetworkModerationService(access,messages);
        moderation.report(new ReportInput("POST",reported,"Spam"));moderation.report(new ReportInput("POST",direct,"Spam"));
        moderation.decide(NetworkAccess.number(moderation.reports().stream().filter(r->NetworkAccess.number(r,"target_id")==reported).findFirst().orElseThrow(),"id"),"HIDE");
        assertEquals("Person 1",moderation.reports().getFirst().get("reporter_name"));
        assertThrows(AppException.class,()->admin.hidePost(deleted,false),"an author's deletion is not undone by admins");
        assertThrows(AppException.class,()->admin.hidePost(deleted,true));
        admin.hidePost(direct,true);
        assertEquals(0,access.count("SELECT COUNT(*) FROM network_report WHERE status='OPEN'"),"hiding directly settles open reports");
        assertEquals(2L,admin.posts("","","hidden",0,10).get("totalElements"));
        assertEquals(1L,admin.posts("","","deleted",0,10).get("totalElements"));
        admin.hidePost(reported,false);
        assertNotNull(posts.get(reported));
        assertThrows(AppException.class,()->admin.hidePost(reported,false),"already visible");

        viewer=4;posts.comment(reported,new CommentInput("Offensive",null));
        long comment=db.queryForObject("SELECT MAX(id) FROM network_comment",Long.class);
        admin.hideComment(comment,true);
        assertEquals(true,((List<Map<String,Object>>)admin.post(reported).get("comments")).getFirst().get("hidden_by_admin"));
        viewer=1;assertEquals(0,posts.comments(reported,0).items().size());

        admin.suspend(2,true);
        assertEquals(1L,admin.members("","suspended",0,10).get("totalElements"));
        assertEquals(List.of(3L),((List<Map<String,Object>>)admin.members("person 3","all",0,10).get("content")).stream().map(m->NetworkAccess.number(m,"account_id")).toList());
        assertThrows(AppException.class,()->posts.get(reported),"a suspended author's posts disappear");
        admin.suspend(2,false);
        var page=admin.members("","all",1,2);
        assertEquals(4L,page.get("totalElements"));assertEquals(2,page.get("totalPages"));assertEquals(true,page.get("last"));
        var overview=admin.overview();
        assertEquals(4L,overview.get("members"));assertEquals(14,((List<?>)overview.get("activity")).size());
        assertTrue(((Map<?,?>)admin.member(4).get("stats")).get("hidden_content").equals(2L));
    }

    @Test void cvIsVisibleOnlyWhenFeaturedOrSentWhileStillShareable() {
        var cvs=new NetworkCvService(access);
        db.update("INSERT INTO cv_profile(id,user_information_id,name,target_mode,publish_mode,is_active,cv_data) VALUES (50,2,'CV Backend','backend','public_link',TRUE,'{\"profile\":{}}')");
        db.update("INSERT INTO cv_profile(id,user_information_id,name,target_mode,publish_mode,is_active) VALUES (51,2,'CV nháp','backend','pdf',TRUE)");
        db.update("INSERT INTO cv_profile(id,user_information_id,name,target_mode,publish_mode,is_active,share_password_hash) VALUES (52,2,'CV mật khẩu','backend','public_link',TRUE,'x')");
        viewer=2;
        var mine=(List<Map<String,Object>>)cvs.mine().get("cvs");
        assertEquals(List.of(true,false,false),mine.stream().sorted(Comparator.comparingLong(c->NetworkAccess.number(c,"id"))).map(c->c.get("shareable")).toList());
        assertThrows(AppException.class,()->cvs.feature(51L),"drafts cannot be featured");
        assertThrows(AppException.class,()->cvs.feature(52L),"password-protected CVs stay out of the community");
        viewer=1;assertThrows(AppException.class,()->cvs.view(50),"not featured or sent yet");
        assertThrows(AppException.class,()->cvs.feature(50L),"only the owner's own CV");
        viewer=2;cvs.feature(50L);
        viewer=1;assertEquals("CV Backend",profiles.profile("person-2").get("featured_cv") instanceof Map<?,?> m?m.get("name"):null);
        assertEquals("CV Backend",cvs.view(50).get("name"));
        assertEquals(1,access.count("SELECT view_count FROM cv_profile WHERE id=50"),"another member's view is counted");
        viewer=2;cvs.view(50);assertEquals(1,access.count("SELECT view_count FROM cv_profile WHERE id=50"),"the owner's own view is not");

        viewer=2;cvs.feature(null);
        viewer=1;assertThrows(AppException.class,()->cvs.view(50));
        connect(1,2);
        viewer=2;long thread=NetworkAccess.number(messages.open(1),"id");
        assertThrows(AppException.class,()->messages.send(thread,new MessageInput("CV nháp",null,null,null,51L)));
        assertThrows(AppException.class,()->messages.send(thread,new MessageInput("Hai thứ",1L,null,null,50L)),"one attachment per message");
        messages.send(thread,new MessageInput("CV của mình",null,null,null,50L));
        viewer=1;assertEquals("CV Backend",((Map<?,?>)((Map<?,?>)((List<?>)messages.get(thread,0).get("messages")).getFirst()).get("shared_cv")).get("name"));
        assertEquals("CV Backend",cvs.view(50).get("name"),"the recipient may open a CV sent to them");
        viewer=3;assertThrows(AppException.class,()->cvs.view(50),"a third member may not");

        db.update("UPDATE cv_profile SET publish_mode='pdf' WHERE id=50");
        viewer=1;assertThrows(AppException.class,()->cvs.view(50),"switching the CV back to draft revokes access");
        assertNull(((Map<?,?>)((List<?>)messages.get(thread,0).get("messages")).getFirst()).get("shared_cv"));
        viewer=2;assertEquals("CV Backend",cvs.view(50).get("name"),"the owner still previews it");
        db.update("UPDATE cv_profile SET publish_mode='public_link' WHERE id=50");
        db.update("INSERT INTO system_setting VALUES ('cv.public_link_enabled','false')");
        viewer=1;assertThrows(AppException.class,()->cvs.view(50),"the admin switch turns every shared CV off");
        db.update("DELETE FROM system_setting");
        assertEquals("CV Backend",cvs.view(50).get("name"));
        viewer=1;profiles.block(2,true);
        assertThrows(AppException.class,()->cvs.view(50),"blocking hides the CV both ways");
    }
}
