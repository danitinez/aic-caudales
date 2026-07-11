import unittest
from datetime import date
from scrapper.data_gatherer import DataGatherer

EXPECTED_IDS = [
    'portezuelo_grande',
    'el_chanar',
    'pichi_picun_leufu',
    'arroyito',
    'el_chanar_arroyito',
]


class TestGatherData(unittest.TestCase):

    def test_gather_data(self):
        with open('tests/test.html', 'r') as file:
            html_content = file.read()

        gatherer = DataGatherer()
        sections = gatherer.parse(html_content)

        self.assertEqual(sections.last_update, date(2024, 5, 12))
        self.assertEqual(len(sections.sections), 5)
        self.assertEqual([s.id for s in sections.sections], EXPECTED_IDS)
        self.assertEqual([s.order for s in sections.sections], [0, 1, 2, 3, 4])

        # Check the first section
        section = sections.sections[0]
        self.assertEqual(section.id, 'portezuelo_grande')
        self.assertEqual(section.title, 'Portezuelo Grande')

        # Check the levels of the first section
        levels = section.levels
        self.assertEqual(len(levels), 6)

        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, date(2024, 5, 11))
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '12')

        for i in range(1, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, date(2024, 5, 11 + i))
            self.assertEqual(levels[i].min, 10)
            self.assertEqual(levels[i].max, 12)
            self.assertIsNone(levels[i].dispensed)


        # Check the last section
        section = sections.sections[-1]
        self.assertEqual(section.id, 'el_chanar_arroyito')
        self.assertEqual(section.title, 'El Chañar + Arroyito')

        # Check the levels of the last section
        levels = section.levels
        self.assertEqual(len(levels), 6)

        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, date(2024, 5, 11))
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '694')

        self.assertEqual(levels[1].type, 'programmed')
        self.assertEqual(levels[1].date, date(2024, 5, 12))
        self.assertEqual(levels[1].min, 770)
        self.assertEqual(levels[1].max, 830)
        self.assertIsNone(levels[1].dispensed)

        for i in range(2, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, date(2024, 5, 11 + i))
            self.assertEqual(levels[i].min, 800)
            self.assertEqual(levels[i].max, 840)
            self.assertIsNone(levels[i].dispensed)


    def test_gather_data2(self):
        with open('tests/test2.html', 'r') as file:
            html_content = file.read()

        gatherer = DataGatherer()
        sections = gatherer.parse(html_content)

        self.assertEqual(sections.last_update, date(2024, 11, 3))
        self.assertEqual(len(sections.sections), 5)
        self.assertEqual([s.id for s in sections.sections], EXPECTED_IDS)
        self.assertEqual([s.order for s in sections.sections], [0, 1, 2, 3, 4])

        # Check the first section
        section = sections.sections[0]
        self.assertEqual(section.id, 'portezuelo_grande')
        self.assertEqual(section.title, 'Portezuelo Grande')

        # Check the levels of the first section
        levels = section.levels
        self.assertEqual(len(levels), 6)

        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, date(2024, 11, 2))
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '12')

        for i in range(1, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, date(2024, 11, 2 + i))
            self.assertEqual(levels[i].min, 10)
            self.assertEqual(levels[i].max, 12)
            self.assertIsNone(levels[i].dispensed)


        # Check the last section
        section = sections.sections[-1]
        self.assertEqual(section.id, 'el_chanar_arroyito')
        self.assertEqual(section.title, 'El Chañar + Arroyito')

        # Check the levels of the last section
        levels = section.levels
        self.assertEqual(len(levels), 6)

        # Check each level
        self.assertEqual(levels[0].type, 'dispensed')
        self.assertEqual(levels[0].date, date(2024, 11, 2))
        self.assertIsNone(levels[0].min)
        self.assertIsNone(levels[0].max)
        self.assertEqual(levels[0].dispensed, '511')

        for i in range(1, 6):
            self.assertEqual(levels[i].type, 'programmed')
            self.assertEqual(levels[i].date, date(2024, 11, 2 + i))
            self.assertEqual(levels[i].min, 530)
            self.assertEqual(levels[i].max, 570)
            self.assertIsNone(levels[i].dispensed)


class TestSectionIdAssignment(unittest.TestCase):

    def test_row_count_mismatch_raises(self):
        with open('tests/test.html', 'r') as file:
            html_content = file.read()

        gatherer = DataGatherer(section_ids=['only_one', 'and_two'])
        with self.assertRaises(ValueError) as ctx:
            gatherer.parse(html_content)
        self.assertIn('sections_config.json', str(ctx.exception))


if __name__ == '__main__':
    unittest.main()
