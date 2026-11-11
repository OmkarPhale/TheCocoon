export const achievementQuestions = [
  {
    id: "mori-found",
    eyebrow: "A new meadow memory",
    title: "Mori has found a friend",
    question: "What would you and Mori like to do first?",
    answers: [
      { id: "follow-lights", label: "Follow the little lights up the hill" },
      { id: "wave-friends", label: "Wave hello to the meadow friends" },
      { id: "quiet-moment", label: "Take a quiet moment together" },
    ],
  },
] as const;

export type AchievementQuestion = (typeof achievementQuestions)[number];
export type AchievementId = AchievementQuestion["id"];
export type AchievementAnswerId = AchievementQuestion["answers"][number]["id"];

export function getAchievementQuestion(
  id: AchievementId,
): AchievementQuestion {
  const question = achievementQuestions.find((item) => item.id === id);
  if (!question) {
    throw new Error(`No story question is registered for achievement "${id}".`);
  }
  return question;
}

export function getAchievementAnswerLabel(
  id: AchievementId,
  answerId: string,
): string | null {
  const answer = getAchievementQuestion(id).answers.find(
    (item) => item.id === answerId,
  );
  return answer?.label ?? null;
}
