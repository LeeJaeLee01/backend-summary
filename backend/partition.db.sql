CREATE TABLE social_media_survey (
    Student_ID INTEGER PRIMARY KEY,
    Age INTEGER,
    Gender VARCHAR(10),
    Academic_Level VARCHAR(20),
    Country VARCHAR(100),
    Avg_Daily_Usage_Hours NUMERIC(4,2),
    Most_Used_Platform VARCHAR(50),
    Affects_Academic_Performance VARCHAR(5),
    Sleep_Hours_Per_Night NUMERIC(3,1),
    Mental_Health_Score INTEGER,
    Relationship_Status VARCHAR(20),
    Conflicts_Over_Social_Media INTEGER,
    Addicted_Score INTEGER
);

CREATE TABLE social_media_survey_partitioned (
    Student_ID INTEGER,
    Age INTEGER,
    Gender VARCHAR(10),
    Academic_Level VARCHAR(20),
    Country VARCHAR(100),
    Avg_Daily_Usage_Hours NUMERIC(4,2),
    Most_Used_Platform VARCHAR(50),
    Affects_Academic_Performance VARCHAR(5),
    Sleep_Hours_Per_Night NUMERIC(3,1),
    Mental_Health_Score INTEGER,
    Relationship_Status VARCHAR(20),
    Conflicts_Over_Social_Media INTEGER,
    Addicted_Score INTEGER,
    CONSTRAINT pk_survey PRIMARY KEY (Student_ID, Age)
)
PARTITION BY RANGE (Age);

CREATE TABLE social_media_survey_age_lt_18
    PARTITION OF social_media_survey_partitioned
    FOR VALUES FROM (0) TO (18);

CREATE TABLE social_media_survey_age_18_21
    PARTITION OF social_media_survey_partitioned
    FOR VALUES FROM (18) TO (22);

CREATE TABLE social_media_survey_age_22_25
    PARTITION OF social_media_survey_partitioned
    FOR VALUES FROM (22) TO (26);

CREATE TABLE social_media_survey_age_26_plus
    PARTITION OF social_media_survey_partitioned
    FOR VALUES FROM (26) TO (150);

INSERT INTO social_media_survey_partitioned
SELECT * FROM social_media_survey;

ALTER TABLE social_media_survey RENAME TO social_media_survey_old;

-- Đổi tên bảng partitioned thành tên chính thức
ALTER TABLE social_media_survey_partitioned RENAME TO social_media_survey;


INSERT INTO social_media_survey (
    Student_ID,
    Age,
    Gender,
    Academic_Level,
    Country,
    Avg_Daily_Usage_Hours,
    Most_Used_Platform,
    Affects_Academic_Performance,
    Sleep_Hours_Per_Night,
    Mental_Health_Score,
    Relationship_Status,
    Conflicts_Over_Social_Media,
    Addicted_Score
)
VALUES
(101,19,'Male','High School','Lebanon',5.8,'YouTube','Yes',5.2,5,'Complicated',4,9),
(102,23,'Female','Graduate','Iraq',2.5,'LinkedIn','No',7.3,8,'Single',1,4),
(103,20,'Male','Undergraduate','Yemen',4.7,'Facebook','Yes',5.8,6,'In Relationship',3,7),
(104,18,'Female','High School','Syria',5.6,'Instagram','Yes',5.4,5,'Single',4,8),
(105,22,'Male','Graduate','Afghanistan',2.9,'LinkedIn','No',7.0,7,'Complicated',2,5),
(106,19,'Female','Undergraduate','Pakistan',4.8,'TikTok','Yes',5.7,6,'In Relationship',3,7),
(107,21,'Male','Undergraduate','Nepal',3.8,'YouTube','No',6.6,7,'Single',2,6),
(108,20,'Female','High School','Bhutan',5.5,'Snapchat','Yes',5.5,5,'Complicated',4,8),
(109,23,'Male','Graduate','Sri Lanka',2.6,'LinkedIn','No',7.2,8,'In Relationship',1,4),
(110,19,'Female','Undergraduate','Maldives',4.9,'Instagram','Yes',5.8,6,'Single',3,7),
(111,20,'Male','Undergraduate','Bangladesh',6.1,'Instagram','Yes',6.2,5,'Single',4,8),
(112,21,'Female','Undergraduate','India',5.8,'TikTok','Yes',5.9,6,'In Relationship',3,7),
(113,19,'Male','Undergraduate','Nepal',4.9,'Facebook','No',7.1,7,'Single',2,5),
(114,22,'Female','Graduate','Pakistan',5.5,'Instagram','Yes',6.0,5,'Single',4,8),
(115,20,'Male','Undergraduate','Sri Lanka',5.2,'TikTok','Yes',6.3,6,'In Relationship',3,7),
(116,19,'Female','Undergraduate','Maldives',4.8,'Instagram','No',7.2,8,'Single',2,5),
(117,21,'Male','Graduate','Bangladesh',6.0,'Facebook','Yes',5.8,5,'In Relationship',4,8),
(118,20,'Female','Undergraduate','India',5.7,'Instagram','Yes',6.1,6,'Single',3,7),
(119,22,'Male','Graduate','Nepal',4.7,'TikTok','No',7.3,7,'Single',2,5),
(120,19,'Female','Undergraduate','Pakistan',5.4,'Instagram','Yes',6.2,5,'In Relationship',4,8),
(121,20,'Male','Undergraduate','Sri Lanka',5.9,'Facebook','Yes',5.9,6,'Single',3,7),
(122,21,'Female','Graduate','Maldives',4.6,'Instagram','No',7.4,8,'In Relationship',2,5),
(123,19,'Male','Undergraduate','Bangladesh',5.3,'TikTok','Yes',6.3,5,'Single',4,8),
(124,22,'Female','Graduate','India',5.8,'Instagram','Yes',5.8,6,'In Relationship',3,7),
(125,20,'Male','Undergraduate','Nepal',4.5,'Facebook','No',7.5,7,'Single',2,5),
(126,21,'Female','Graduate','Pakistan',5.2,'Instagram','Yes',6.4,5,'In Relationship',4,8),
(127,19,'Male','Undergraduate','Sri Lanka',5.7,'TikTok','Yes',5.7,6,'Single',3,7),
(128,20,'Female','Undergraduate','Maldives',4.4,'Instagram','No',7.6,8,'In Relationship',2,5),
(129,22,'Male','Graduate','Bangladesh',5.1,'Facebook','Yes',6.5,5,'Single',4,8),
(130,21,'Female','Graduate','India',5.6,'Instagram','Yes',5.6,6,'In Relationship',3,7),
(131,19,'Male','Undergraduate','Nepal',4.3,'TikTok','No',7.7,7,'Single',2,5),
(132,20,'Female','Undergraduate','Pakistan',5.0,'Instagram','Yes',6.6,5,'In Relationship',4,8),
(133,22,'Male','Graduate','Sri Lanka',5.5,'Facebook','Yes',5.5,6,'Single',3,7),
(134,21,'Female','Graduate','Maldives',4.2,'Instagram','No',7.8,8,'In Relationship',2,5),
(135,19,'Male','Undergraduate','Bangladesh',4.9,'TikTok','Yes',6.7,5,'Single',4,8),
(136,20,'Female','Undergraduate','India',5.4,'Instagram','Yes',5.4,6,'In Relationship',3,7),
(137,22,'Male','Graduate','Nepal',4.1,'Facebook','No',7.9,7,'Single',2,5),
(138,21,'Female','Graduate','Pakistan',4.8,'Instagram','Yes',6.8,5,'In Relationship',4,8),
(139,19,'Male','Undergraduate','Sri Lanka',5.3,'TikTok','Yes',5.3,6,'Single',3,7),
(140,20,'Female','Undergraduate','Maldives',4.0,'Instagram','No',8.0,8,'In Relationship',2,5),
(141,22,'Male','Graduate','Bangladesh',4.7,'Facebook','Yes',6.9,5,'Single',4,8),
(142,21,'Female','Graduate','India',5.2,'Instagram','Yes',5.2,6,'In Relationship',3,7),
(143,19,'Male','Undergraduate','Nepal',3.9,'TikTok','No',8.1,7,'Single',2,5),
(144,20,'Female','Undergraduate','Pakistan',4.6,'Instagram','Yes',7.0,5,'In Relationship',4,8),
(145,22,'Male','Graduate','Sri Lanka',5.1,'Facebook','Yes',5.1,6,'Single',3,7),
(146,21,'Female','Graduate','Maldives',3.8,'Instagram','No',8.2,8,'In Relationship',2,5),
(147,19,'Male','Undergraduate','Bangladesh',4.5,'TikTok','Yes',7.1,5,'Single',4,8),
(148,20,'Female','Undergraduate','India',5.0,'Instagram','Yes',5.0,6,'In Relationship',3,7),
(149,22,'Male','Graduate','Nepal',3.7,'Facebook','No',8.3,7,'Single',2,5),
(150,21,'Female','Graduate','Pakistan',4.4,'Instagram','Yes',7.2,5,'In Relationship',4,8),
(151,19,'Male','Undergraduate','Sri Lanka',4.9,'TikTok','Yes',4.9,6,'Single',3,7),
(152,20,'Female','Undergraduate','Maldives',3.6,'Instagram','No',8.4,8,'In Relationship',2,5),
(153,22,'Male','Graduate','Bangladesh',4.3,'Facebook','Yes',7.3,5,'Single',4,8),
(154,21,'Female','Graduate','India',4.8,'Instagram','Yes',4.8,6,'In Relationship',3,7),
(155,19,'Male','Undergraduate','Nepal',3.5,'TikTok','No',8.5,7,'Single',2,5),
(156,20,'Female','Undergraduate','Pakistan',4.2,'Instagram','Yes',7.4,5,'In Relationship',4,8),
(157,22,'Male','Graduate','Sri Lanka',4.7,'Facebook','Yes',4.7,6,'Single',3,7),
(158,21,'Female','Graduate','Maldives',3.4,'Instagram','No',8.6,8,'In Relationship',2,5),
(159,19,'Male','Undergraduate','Bangladesh',4.1,'TikTok','Yes',7.5,5,'Single',4,8),
(160,20,'Female','Undergraduate','India',4.6,'Instagram','Yes',4.6,6,'In Relationship',3,7),
(161,19,'Female','Undergraduate','Bangladesh',5.3,'Instagram','Yes',6.1,5,'Single',3,7),
(162,21,'Male','Graduate','India',4.8,'Facebook','No',7.2,7,'In Relationship',2,6),
(163,20,'Female','Undergraduate','Nepal',5.5,'TikTok','Yes',5.9,6,'Single',4,8),
(164,22,'Male','Graduate','Pakistan',4.7,'Instagram','Yes',6.3,5,'In Relationship',3,7),
(165,19,'Female','Undergraduate','Sri Lanka',5.1,'Facebook','No',7.0,7,'Single',2,5),
(166,21,'Male','Graduate','Maldives',5.4,'TikTok','Yes',6.0,6,'In Relationship',4,8),
(167,20,'Female','Undergraduate','Bangladesh',4.9,'Instagram','Yes',6.4,5,'Single',3,7),
(168,22,'Male','Graduate','India',5.2,'Facebook','No',7.1,7,'In Relationship',2,6),
(169,19,'Female','Undergraduate','Nepal',5.6,'TikTok','Yes',5.8,6,'Single',4,8),
(170,21,'Male','Graduate','Pakistan',4.6,'Instagram','Yes',6.5,5,'In Relationship',3,7),
(171,20,'Female','Undergraduate','Sri Lanka',5.0,'Facebook','No',7.3,7,'Single',2,5),
(172,22,'Male','Graduate','Maldives',5.3,'TikTok','Yes',5.7,6,'In Relationship',4,8),
(173,19,'Female','Undergraduate','Bangladesh',4.8,'Instagram','Yes',6.6,5,'Single',3,7),
(174,21,'Male','Graduate','India',5.1,'Facebook','No',7.4,7,'In Relationship',2,6),
(175,20,'Female','Undergraduate','Nepal',5.7,'TikTok','Yes',5.6,6,'Single',4,8),
(176,22,'Male','Graduate','Pakistan',4.5,'Instagram','Yes',6.7,5,'In Relationship',3,7),
(177,19,'Female','Undergraduate','Sri Lanka',4.9,'Facebook','No',7.5,7,'Single',2,5),
(178,21,'Male','Graduate','Maldives',5.2,'TikTok','Yes',5.5,6,'In Relationship',4,8),
(179,20,'Female','Undergraduate','Bangladesh',4.7,'Instagram','Yes',6.8,5,'Single',3,7),
(180,22,'Male','Graduate','India',5.0,'Facebook','No',7.6,7,'In Relationship',2,6),
(181,19,'Female','Undergraduate','Nepal',5.8,'TikTok','Yes',5.4,6,'Single',4,8),
(182,21,'Male','Graduate','Pakistan',4.4,'Instagram','Yes',6.9,5,'In Relationship',3,7),
(183,20,'Female','Undergraduate','Sri Lanka',4.8,'Facebook','No',7.7,7,'Single',2,5),
(184,22,'Male','Graduate','Maldives',5.1,'TikTok','Yes',5.3,6,'In Relationship',4,8),
(185,19,'Female','Undergraduate','Bangladesh',4.6,'Instagram','Yes',7.0,5,'Single',3,7),
(186,21,'Male','Graduate','India',4.9,'Facebook','No',7.8,7,'In Relationship',2,6),
(187,20,'Female','Undergraduate','Nepal',5.9,'TikTok','Yes',5.2,6,'Single',4,8),
(188,22,'Male','Graduate','Pakistan',4.3,'Instagram','Yes',7.1,5,'In Relationship',3,7),
(189,19,'Female','Undergraduate','Sri Lanka',4.7,'Facebook','No',7.9,7,'Single',2,5),
(190,21,'Male','Graduate','Maldives',5.0,'TikTok','Yes',5.1,6,'In Relationship',4,8),
(191,20,'Female','Undergraduate','Bangladesh',4.5,'Instagram','Yes',7.2,5,'Single',3,7),
(192,22,'Male','Graduate','India',4.8,'Facebook','No',8.0,7,'In Relationship',2,6),
(193,19,'Female','Undergraduate','Nepal',6.0,'TikTok','Yes',5.0,6,'Single',4,8),
(194,21,'Male','Graduate','Pakistan',4.2,'Instagram','Yes',7.3,5,'In Relationship',3,7),
(195,20,'Female','Undergraduate','Sri Lanka',4.6,'Facebook','No',8.1,7,'Single',2,5),
(196,22,'Male','Graduate','Maldives',4.9,'TikTok','Yes',4.9,6,'In Relationship',4,8),
(197,19,'Female','Undergraduate','Bangladesh',4.4,'Instagram','Yes',7.4,5,'Single',3,7),
(198,21,'Male','Graduate','India',4.7,'Facebook','No',8.2,7,'In Relationship',2,6),
(199,20,'Female','Undergraduate','Nepal',6.1,'TikTok','Yes',4.8,6,'Single',4,8),
(200,22,'Male','Graduate','Pakistan',4.1,'Instagram','Yes',7.5,5,'In Relationship',3,7)
