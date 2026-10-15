package lemonadex.lemoguide.lemoguide_mvp.network;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/network")
@RequiredArgsConstructor
@Validated
public class NetworkController {
    private final NetworkProfileService profiles;
    private final NetworkPostService posts;
    private final NetworkMessageService messages;
    private final NetworkLearningService learning;
    private final NetworkModerationService moderation;
    private final NetworkCohortService cohorts;
    private final NetworkBuddyService buddies;
    private final NetworkEvents events;
    private final NetworkImageStorage images;
    private final NetworkAccess access;
    private final NetworkMentorService mentors;
    private final NetworkReputationService reputation;
    private final NetworkAssistService assist;
    private final NetworkChallengeService challenges;
    private final NetworkCvService cvs;

    @GetMapping("/me/cvs") public ApiResponse<?> myCvs(){return ApiResponse.success(cvs.mine());}
    @PutMapping("/me/featured-cv") public ApiResponse<?> featureCv(@Valid @RequestBody FeatureCv request){cvs.feature(request.cvId());return ApiResponse.success(null);}
    @GetMapping("/cvs/{id}") public ApiResponse<?> cv(@PathVariable long id){return ApiResponse.success(cvs.view(id));}

    @GetMapping("/mentors") public ApiResponse<?> mentors(@RequestParam(defaultValue="") @Size(max=150) String q){return ApiResponse.success(mentors.mentors(q));}
    @GetMapping("/mentoring") public ApiResponse<?> mentoring(){return ApiResponse.success(mentors.overview());}
    @PostMapping("/people/{id}/mentoring") public ApiResponse<?> requestMentor(@PathVariable long id,@Valid @RequestBody MentorRequestInput request){return ApiResponse.success(mentors.request(id,request));}
    @PutMapping("/mentoring/{id}/schedule") public ApiResponse<?> scheduleMentoring(@PathVariable long id,@Valid @RequestBody MentorSchedule request){mentors.schedule(id,request);return ApiResponse.success(null);}
    @PutMapping("/mentoring/{id}/decline") public ApiResponse<?> declineMentoring(@PathVariable long id,@Valid @RequestBody MentorNote request){mentors.decline(id,request.note());return ApiResponse.success(null);}
    @PutMapping("/mentoring/{id}/cancel") public ApiResponse<?> cancelMentoring(@PathVariable long id){mentors.cancel(id);return ApiResponse.success(null);}
    @PutMapping("/mentoring/{id}/complete") public ApiResponse<?> completeMentoring(@PathVariable long id,@Valid @RequestBody MentorComplete request){mentors.complete(id,request);return ApiResponse.success(null);}
    @PutMapping("/people/{id}/endorsements/{kind}/{itemId}") public ApiResponse<?> endorse(@PathVariable long id,@PathVariable String kind,@PathVariable long itemId,@RequestBody State state){reputation.endorse(id,kind,itemId,state.enabled());return ApiResponse.success(null);}
    @PutMapping("/posts/{id}/comments/{commentId}/helpful") public ApiResponse<?> helpful(@PathVariable long id,@PathVariable long commentId,@RequestBody State state){posts.helpful(id,commentId,state.enabled());return ApiResponse.success(null);}
    @GetMapping("/posts/{id}/ai") public ApiResponse<?> aiNotes(@PathVariable long id){return ApiResponse.success(assist.notes(id));}
    @PostMapping("/posts/{id}/ai/draft") public ApiResponse<?> aiDraft(@PathVariable long id,@Valid @RequestBody AiInput request){return ApiResponse.success(assist.draft(id,request.modelId()));}
    @PostMapping("/posts/{id}/ai/summary") public ApiResponse<?> aiSummary(@PathVariable long id,@Valid @RequestBody AiInput request){return ApiResponse.success(assist.summarize(id,request.modelId()));}
    @PostMapping("/ai/tags") public ApiResponse<?> aiTags(@Valid @RequestBody TagInput request){return ApiResponse.success(assist.tags(request.content(),request.modelId()));}
    @GetMapping("/challenges") public ApiResponse<?> challenges(){return ApiResponse.success(challenges.list());}
    @GetMapping("/challenges/{id}") public ApiResponse<?> challenge(@PathVariable long id){return ApiResponse.success(challenges.get(id));}
    @PutMapping("/challenges/{id}/entry") public ApiResponse<?> submitEntry(@PathVariable long id,@Valid @RequestBody EntryInput request){challenges.submit(id,request);return ApiResponse.success(null);}
    @DeleteMapping("/challenges/{id}/entry") public ApiResponse<?> withdrawEntry(@PathVariable long id){challenges.withdraw(id);return ApiResponse.success(null);}
    @PutMapping("/challenge-entries/{id}/vote") public ApiResponse<?> vote(@PathVariable long id,@RequestBody State state){challenges.vote(id,state.enabled());return ApiResponse.success(null);}

    /** Live "something changed" signals for the signed-in member; the client refetches through the normal API. */
    @GetMapping(value="/stream",produces=org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter stream(){return events.subscribe(access.me());}
    @PostMapping("/me/publish") public ApiResponse<?> publish(@RequestBody PublishInput request){return ApiResponse.success(profiles.publish(request.autoShareMilestones()));}
    @GetMapping("/company-people") public ApiResponse<?> companyPeople(@RequestParam @Size(max=200) String company){return ApiResponse.success(profiles.companyPeople(company));}
    @PostMapping(value="/uploads",consumes=org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> upload(@RequestParam("file") org.springframework.web.multipart.MultipartFile file){
        long me=access.me();access.member(me);
        return ApiResponse.success(java.util.Map.of("url",images.store(me,file)));
    }
    @PutMapping("/posts/{id}") public ApiResponse<?> editPost(@PathVariable long id,@Valid @RequestBody PostEdit request){return ApiResponse.success(posts.edit(id,request));}
    @PutMapping("/posts/{id}/comments/{commentId}") public ApiResponse<?> editComment(@PathVariable long id,@PathVariable long commentId,@Valid @RequestBody Text request){posts.editComment(id,commentId,request.content());return ApiResponse.success(null);}
    @GetMapping("/cohorts") public ApiResponse<?> cohorts(){return ApiResponse.success(cohorts.overview());}
    @PostMapping("/cohorts") public ApiResponse<?> joinCohort(@Valid @RequestBody CohortJoin request){return ApiResponse.success(cohorts.join(request.kind(),request.refKey()));}
    @GetMapping("/cohorts/{id}") public ApiResponse<?> cohort(@PathVariable long id,@RequestParam(defaultValue="0") @Min(0) long before){return ApiResponse.success(cohorts.get(id,before));}
    @DeleteMapping("/cohorts/{id}/membership") public ApiResponse<?> leaveCohort(@PathVariable long id){cohorts.leave(id);return ApiResponse.success(null);}
    @PostMapping("/cohorts/{id}/messages") public ApiResponse<?> cohortMessage(@PathVariable long id,@Valid @RequestBody CohortMessage request){cohorts.send(id,request.content());return ApiResponse.success(null);}
    @PostMapping("/cohorts/{id}/checkins") public ApiResponse<?> checkin(@PathVariable long id,@Valid @RequestBody CheckinInput request){cohorts.checkin(id,request.note());return ApiResponse.success(null);}
    @PutMapping("/cohorts/{id}/read") public ApiResponse<?> cohortRead(@PathVariable long id,@Valid @RequestBody ReadInput request){cohorts.read(id,request.lastId());return ApiResponse.success(null);}
    @GetMapping("/buddy") public ApiResponse<?> buddy(){return ApiResponse.success(buddies.overview());}
    @PostMapping("/people/{id}/buddy/{action}") public ApiResponse<?> buddyAction(@PathVariable long id,@PathVariable String action){buddies.act(id,action);return ApiResponse.success(null);}
    @PostMapping("/buddy/nudge") public ApiResponse<?> nudge(){buddies.nudge();return ApiResponse.success(null);}
    @GetMapping("/me") public ApiResponse<?> me(){return ApiResponse.success(profiles.mine());}
    @PutMapping("/me") public ApiResponse<?> save(@Valid @RequestBody Settings request){return ApiResponse.success(profiles.save(request));}
    @GetMapping("/profiles/{handle}") public ApiResponse<?> profile(@PathVariable String handle){return ApiResponse.success(profiles.profile(handle));}
    @GetMapping("/people") public ApiResponse<?> people(@RequestParam(defaultValue="") @Size(max=150) String q,@RequestParam(defaultValue="discover") String mode,@RequestParam(defaultValue="0") @Min(0) long page){return ApiResponse.success(profiles.people(q,mode,page));}
    @PutMapping("/people/{id}/follow") public ApiResponse<?> follow(@PathVariable long id,@RequestBody State state){profiles.follow(id,state.enabled());return ApiResponse.success(null);}
    @PostMapping("/people/{id}/connections/{action}") public ApiResponse<?> connect(@PathVariable long id,@PathVariable String action){profiles.connect(id,action);return ApiResponse.success(null);}
    @PutMapping("/people/{id}/block") public ApiResponse<?> block(@PathVariable long id,@RequestBody State state){profiles.block(id,state.enabled());return ApiResponse.success(null);}
    @GetMapping("/summary") public ApiResponse<?> summary(){return ApiResponse.success(profiles.summary());}
    @GetMapping("/blocks") public ApiResponse<?> blocks(){return ApiResponse.success(profiles.blocked());}
    @GetMapping("/notifications") public ApiResponse<?> notifications(){return ApiResponse.success(profiles.notifications());}
    @PutMapping("/notifications/read") public ApiResponse<?> notificationsRead(@Valid @RequestBody ReadInput request){profiles.readNotifications(request.lastId());return ApiResponse.success(null);}
    @GetMapping("/posts") public ApiResponse<?> feed(@RequestParam(defaultValue="all") String mode,@RequestParam(defaultValue="") @Size(max=100) String tag,@RequestParam(required=false) Long author,@RequestParam(defaultValue="0") @Min(0) long before){return ApiResponse.success(posts.feed(mode,tag,author,before));}
    @GetMapping("/posts/{id}") public ApiResponse<?> post(@PathVariable long id){return ApiResponse.success(posts.get(id));}
    @PostMapping("/posts") public ApiResponse<?> create(@Valid @RequestBody PostInput request){return ApiResponse.success(posts.create(request));}
    @DeleteMapping("/posts/{id}") public ApiResponse<?> delete(@PathVariable long id){posts.remove(id);return ApiResponse.success(null);}
    @PutMapping("/posts/{id}/reactions/{kind}") public ApiResponse<?> react(@PathVariable long id,@PathVariable String kind,@RequestBody State state){posts.react(id,kind,state.enabled());return ApiResponse.success(null);}
    @GetMapping("/posts/{id}/comments") public ApiResponse<?> comments(@PathVariable long id,@RequestParam(defaultValue="0") @Min(0) long before){return ApiResponse.success(posts.comments(id,before));}
    @PostMapping("/posts/{id}/comments") public ApiResponse<?> comment(@PathVariable long id,@Valid @RequestBody CommentInput request){posts.comment(id,request);return ApiResponse.success(null);}
    @DeleteMapping("/posts/{id}/comments/{commentId}") public ApiResponse<?> deleteComment(@PathVariable long id,@PathVariable long commentId){posts.removeComment(id,commentId);return ApiResponse.success(null);}
    @PutMapping("/posts/{id}/comments/{commentId}/accepted") public ApiResponse<?> accept(@PathVariable long id,@PathVariable long commentId,@RequestBody State state){posts.accept(id,commentId,state.enabled());return ApiResponse.success(null);}
    @PostMapping("/people/{id}/threads") public ApiResponse<?> open(@PathVariable long id){return ApiResponse.success(messages.open(id));}
    @GetMapping("/threads") public ApiResponse<?> threads(){return ApiResponse.success(messages.threads());}
    @GetMapping("/threads/{id}") public ApiResponse<?> thread(@PathVariable long id,@RequestParam(defaultValue="0") @Min(0) long before){return ApiResponse.success(messages.get(id,before));}
    @PostMapping("/threads/{id}/messages") public ApiResponse<?> send(@PathVariable long id,@Valid @RequestBody MessageInput request){messages.send(id,request);return ApiResponse.success(null);}
    @PutMapping("/threads/{id}/decision") public ApiResponse<?> decide(@PathVariable long id,@RequestBody State request){messages.decide(id,request.enabled());return ApiResponse.success(null);}
    @PutMapping("/threads/{id}/read") public ApiResponse<?> read(@PathVariable long id,@Valid @RequestBody ReadInput request){messages.read(id,request.lastId());return ApiResponse.success(null);}
    @PostMapping("/reports") public ApiResponse<?> report(@Valid @RequestBody ReportInput request){moderation.report(request);return ApiResponse.success(null);}
    @PostMapping("/people/{id}/comparisons") public ApiResponse<?> compare(@PathVariable long id,@Valid @RequestBody CompareInput request){return ApiResponse.success(learning.compare(id,request));}
    @PostMapping("/comparisons/{id}/preview") public ApiResponse<?> preview(@PathVariable long id,@Valid @RequestBody ApplyInput request){return ApiResponse.success(learning.preview(id,request));}
}
