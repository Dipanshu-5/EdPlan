import nlp from 'compromise';

export const parseQuery = (query) => {
  const doc = nlp(query);
  const criteria = { intent: 'search' };

  if (doc.has('compare')) {
    criteria.intent = 'compare';
    const universities = doc.match('[university #ProperNoun+]').terms().out('array');
    criteria.universities = universities.map((name) => name.replace(/university\s*/i, '').trim());
    return criteria;
  }

  const gradeMatch = doc.match('grade [#Value]').text();
  const gradeNumber = gradeMatch.match(/\d+/)?.[0];
  if (gradeNumber) {
    criteria.grade = parseInt(gradeNumber, 10);
  }

  const locationMatch = doc.match('in [#Noun+]');
  if (locationMatch.found) {
    criteria.location = locationMatch.out('text').replace('in ', '').trim();
  }

  if (doc.has('cheap') || doc.has('affordable')) {
    criteria.cost_of_living = 5;
  }

  if (doc.has('placement')) {
    criteria.placement_rate = 90;
  }

  return criteria;
};
